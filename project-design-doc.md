# MaterniFlow — 妇产科智能调度系统 项目设计文档

> **文档版本**：v1.0
> **最后更新**：2026-02
> **用途**：开发者照此文档可无歧义地完成全部开发工作

---

## 一、项目概述

### 1.1 一句话描述

一个**面向妇产科护士的 AI 调度助手**。护士通过聊天界面与 AI Agent 对话，Agent 实时查询病房状态、预测产妇住院时长、辅助房间调度、发出高危预警、协助下达医嘱，并可生成可下载的结构化报告。

### 1.2 面试叙事

> "我做了一个妇产科病房的 AI 调度助手。护士跟它对话，它能实时查病房状态、预测产妇住院时长、帮助安排房间周转、还能直接下医嘱。底下是 AWS 上的后端服务，连着病人数据库和 EHR 系统。"

### 1.3 覆盖技能

AI Agent + Tool Calling、AWS Lambda、AWS S3、AWS CDK、AWS Bedrock、数据库设计、后端 API（FastAPI）、前端 Chat 界面（Next.js）

---

## 二、技术栈

| 层级 | 技术 | 部署位置 |
|------|------|----------|
| 前端 | Next.js + TypeScript | Vercel |
| BFF 层 | FastAPI (Python) | Vercel（和 Next.js 一起部署） |
| AI Agent | Strands Agents SDK (Python) | AWS Lambda |
| LLM | AWS Bedrock（Claude 模型） | AWS 托管 |
| 写操作执行 | 5 个独立 Lambda (Python) | AWS Lambda |
| 数据库 | PostgreSQL | NeonDB（托管） |
| 文件存储 | S3 | AWS |
| 基础设施定义 | AWS CDK (Python) | — |

---

## 三、系统架构

### 3.1 整体数据流

**前端 → BFF → Agent Lambda → 读数据库 / 调用写操作 Lambda → 返回结果**

详细流程：

1. 护士在 Next.js 聊天界面输入消息
2. 前端调用 FastAPI（BFF 层）的 `/chat` 接口
3. FastAPI 通过 boto3 invoke 调用 **Agent Lambda**
4. Agent Lambda 中运行 Strands Agent，使用 Bedrock 提供的 LLM 进行推理
5. Agent 根据推理结果调用 Tool：
   - **读操作**：Agent 直接连接 NeonDB 执行 SQL 查询（只读权限）
   - **写操作**：Agent 通过 Tool 调用对应的写操作 Lambda（boto3 invoke + 参数）
6. 写操作 Lambda 执行**独立的业务校验**，校验通过后写入数据库
7. `generate-report` Lambda 额外写入 S3 并生成 Presigned URL
8. 结果逐层返回到前端，展示给护士

### 3.2 核心架构原则：AI 安全边界

**Agent 只有数据库的只读权限。所有写操作必须通过独立 Lambda 执行。**

这是整个架构最重要的设计决策。原因：

- Agent（LLM）可能产生幻觉或错误判断，不能让它直接修改数据
- 每个写操作 Lambda 都有独立的业务校验逻辑，即使 Agent 判断错误，Lambda 也能拦住
- 所有 AI 发起的操作都有审计记录（`created_by = "ai_assisted"`）

面试表述：**"Agent 是眼睛和嘴，能看能说但不能动；Lambda 是手，动之前会自己检查一遍。"**

### 3.3 FastAPI 的角色定位

FastAPI 在本项目中是 **BFF（Backend for Frontend）层**，职责极其有限：

- 接收前端请求
- 通过 boto3 invoke 调用 Agent Lambda
- 将 Agent Lambda 的响应流式返回给前端
- 处理登录认证

FastAPI **不直接连接数据库，不包含业务逻辑**。

---

## 四、数据库设计

### 4.1 总览

共 **11 张表**，每张表都有明确的业务用途，无冗余。

**实体关系概述**：

- Patient 和 OBProfile 是 1:1 关系
- Patient 和 Admission 是 1:N 关系（一个产妇可能多次入院）
- Admission 是业务主线，关联 LaborProgress、VitalSign、Order 三张时序/事务表
- Room 和 Bed 是 1:N 关系（一个房间多张床）
- Bed 和 Admission 通过 current_admission_id 形成当前占用关系
- Order 关联 Provider（执行医生）
- Provider 关联 Shift（排班）
- Alert 关联 Admission（预警记录）

### 4.2 表结构详细设计

---

#### 表1：Patient（产妇）

存储产妇的基本身份信息，与产科信息分离。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| patient_id | UUID | PK | 主键 |
| name | VARCHAR | NOT NULL | 姓名 |
| age | INT | NOT NULL | 年龄，≥35 为高龄产妇（风险因子） |
| phone | VARCHAR | | 联系电话 |
| emergency_contact | VARCHAR | | 紧急联系人 |
| insurance_type | ENUM | | Medicaid / commercial / self_pay，影响出院节奏 |

设计思路：尽量瘦，产科相关信息全放 OBProfile。Patient 只存"人"的信息。

---

#### 表2：OBProfile（产科档案）

**业务最核心的表。** AI 预测住院时长、判断风险等级全靠它。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| ob_id | UUID | PK | 主键 |
| patient_id | UUID | FK → Patient, UNIQUE | 一个产妇一份产科档案 |
| gravida | INT | NOT NULL | 第几次怀孕（G），如 G2 = 第二次怀孕 |
| para | INT | NOT NULL | 第几次分娩（P），如 P1 = 生过一次 |
| gestational_weeks | DECIMAL | NOT NULL | 当前孕周，如 38.4 |
| edd | DATE | NOT NULL | 预产期（Estimated Due Date） |
| fetus_count | INT | NOT NULL, DEFAULT 1 | 胎数。双胎/多胎 = 高危 + 住院更久 |
| prior_delivery_method | ENUM | | none / vaginal / c_section，既往分娩方式，影响本次计划 |
| planned_delivery_method | ENUM | NOT NULL | vaginal / c_section / vbac（剖后顺） |
| risk_level | ENUM | NOT NULL | low / medium / high，由系统根据其他字段计算 |
| complications | JSON | | 合并症列表，如 `["妊娠糖尿病", "妊娠高血压", "前置胎盘"]` |
| gbs_status | ENUM | | positive / negative / unknown，B族链球菌，影响产时用药 |
| notes | TEXT | | 医生备注的特殊情况 |

为什么 complications 用 JSON：合并症种类多、组合不固定，用 JSON 最灵活。Agent 读取后可以直接推理风险等级。

---

#### 表3：Room（病房）

描述物理空间，**不存储状态**。状态通过 Bed 的占用情况动态算出。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| room_id | UUID | PK | 主键 |
| room_number | VARCHAR | UNIQUE, NOT NULL | 如 "L-203" |
| room_type | ENUM | NOT NULL | labor（待产）/ delivery（产房）/ postpartum（产后恢复）/ nicu / triage（分诊观察） |
| floor | INT | NOT NULL | 楼层 |

---

#### 表4：Bed（床位）

Room 和 Bed 分开的原因：产后恢复室通常是多人间（1 房 2-3 床），待产室和产房通常是单人间（1 房 1 床）。不分开无法准确计算容量。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| bed_id | UUID | PK | 主键 |
| room_id | UUID | FK → Room, NOT NULL | 所属房间 |
| bed_label | VARCHAR | NOT NULL | 如 "A", "B" |
| status | ENUM | NOT NULL, DEFAULT 'available' | available / occupied / cleaning / maintenance |
| current_admission_id | UUID | FK → Admission, NULLABLE | 当前住的是谁，空床则为 NULL |

---

#### 表5：Admission（入院记录）

**贯穿整个住院周期的主线记录。** 一次怀孕入院对应一条 Admission。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| admission_id | UUID | PK | 主键 |
| patient_id | UUID | FK → Patient, NOT NULL | |
| ob_id | UUID | FK → OBProfile, NOT NULL | |
| admit_time | DATETIME | NOT NULL | 入院时间 |
| status | ENUM | NOT NULL | 见下方状态机 |
| delivery_method_actual | ENUM | NULLABLE | 实际分娩方式，分娩后填入 |
| delivery_time | DATETIME | NULLABLE | 实际分娩时间 |
| predicted_los_hours | INT | NULLABLE | AI 预测的住院时长（小时） |
| predicted_discharge_time | DATETIME | NULLABLE | AI 算出的预计出院时间 |
| actual_discharge_time | DATETIME | NULLABLE | 实际出院时间 |
| current_bed_id | UUID | FK → Bed, NULLABLE | 当前床位 |
| attending_provider_id | UUID | FK → Provider | 主管医生 |
| primary_nurse_id | UUID | FK → Provider | 责任护士 |

**Admission.status 状态机**（整个系统的核心流转）：

```
admitted → in_labor → delivered → postpartum → ready_for_discharge → discharged
```

- `admitted`：已入院，待产中
- `in_labor`：产程进行中
- `delivered`：已分娩
- `postpartum`：产后恢复中
- `ready_for_discharge`：医生已确认可出院，等待办手续
- `discharged`：已出院

Agent 根据 status 分布判断全局态势。护士问"今天啥情况"靠的就是这个字段的聚合。

---

#### 表6：LaborProgress（产程记录）

**时间序列表。** 支撑场景2（房间调度）的关键。Agent 要预判"什么时候能腾房间"，必须知道产妇的产程进展速度。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| progress_id | UUID | PK | 主键 |
| admission_id | UUID | FK → Admission, NOT NULL | |
| recorded_at | DATETIME | NOT NULL | 记录时间 |
| cervical_dilation_cm | DECIMAL | NOT NULL | 宫颈扩张（cm），0-10，10cm = 宫口全开 |
| effacement_pct | INT | | 宫颈消退百分比 |
| station | INT | | 胎头位置，-3 到 +3 |
| contraction_freq | INT | | 宫缩频率（次/10分钟） |
| membrane_status | ENUM | NOT NULL | intact（未破水）/ ruptured（已破水） |
| notes | TEXT | | |

每次检查插入一条。Agent 可看趋势："2小时前开 3cm，现在开 6cm，按这个速度大概还有 2-3 小时"。

---

#### 表7：VitalSign（生命体征）

**时间序列表。** 支撑场景4（高危预警）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| vital_id | UUID | PK | 主键 |
| admission_id | UUID | FK → Admission, NOT NULL | |
| recorded_at | DATETIME | NOT NULL | |
| bp_systolic | INT | NOT NULL | 收缩压，≥140 触发高血压预警 |
| bp_diastolic | INT | NOT NULL | 舒张压，≥90 触发预警 |
| heart_rate | INT | NOT NULL | 心率 |
| temperature | DECIMAL | NOT NULL | 体温，≥38°C 可能提示感染 |
| fetal_heart_rate | INT | NOT NULL | 胎心率，正常 110-160，偏离则预警 |
| oxygen_saturation | DECIMAL | NOT NULL | 血氧 |

Agent 做高危预警时，不只看最新一条，还看**趋势** —— "血压从今早开始连续 3 次上升"比"当前血压 140"更有预警价值。

---

#### 表8：Order（医嘱/手术单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| order_id | UUID | PK | 主键 |
| admission_id | UUID | FK → Admission, NOT NULL | |
| order_type | ENUM | NOT NULL | c_section / induction / epidural / lab_test / medication / consult |
| status | ENUM | NOT NULL | scheduled / in_progress / completed / cancelled |
| scheduled_time | DATETIME | NOT NULL | 预约时间 |
| assigned_provider_id | UUID | FK → Provider, NOT NULL | 执行医生 |
| assigned_room_id | UUID | FK → Room, NULLABLE | 占用哪间产房（手术类需要） |
| priority | ENUM | NOT NULL, DEFAULT 'routine' | routine / urgent / emergency |
| notes | TEXT | | |
| created_by | VARCHAR | NOT NULL | 谁下的单。可以是护士姓名，也可以是 `"ai_assisted"` |

`created_by` 字段用于审计追踪，标记哪些医嘱是 AI 辅助创建的。

---

#### 表9：Provider（医护人员）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| provider_id | UUID | PK | 主键 |
| name | VARCHAR | NOT NULL | |
| role | ENUM | NOT NULL | attending / resident / nurse / midwife / anesthesiologist |
| department | VARCHAR | | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 是否在职 |

---

#### 表10：Shift（排班）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| shift_id | UUID | PK | 主键 |
| provider_id | UUID | FK → Provider, NOT NULL | |
| shift_date | DATE | NOT NULL | |
| shift_type | ENUM | NOT NULL | day（白班 7:00-19:00）/ night（夜班 19:00-7:00） |
| assigned_room_ids | JSON | | 负责的房间列表，如 `["L-201","L-202","L-203"]` |

场景5 的查询路径：护士说"预约明天上午的剖腹产" → Agent 查 Shift 表找明天白班的 attending + anesthesiologist → 再查他们的 Order 看有没有时间冲突。

---

#### 表11：Alert（预警记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| alert_id | UUID | PK | 主键 |
| admission_id | UUID | FK → Admission, NOT NULL | |
| alert_type | ENUM | NOT NULL | high_bp / abnormal_fhr / fever / preterm_risk |
| severity | ENUM | NOT NULL | warning / critical |
| message | TEXT | NOT NULL | AI 生成的预警描述 |
| triggered_at | DATETIME | NOT NULL | |
| acknowledged | BOOLEAN | NOT NULL, DEFAULT false | 护士是否已确认看到 |
| acknowledged_by | UUID | FK → Provider, NULLABLE | 确认的护士 |

---

## 五、五个业务场景

### 5.1 场景一：早班交接 —— "今天啥情况？"

**触发**：护士上班，想了解全局

**Agent 执行流程**：

1. 查 Admission 表：当前所有 status ≠ discharged 的记录 → 在院产妇总数及各状态分布
2. 查 Bed + Room 表：各类型房间的占用率、哪些床今天可能空出来
3. 查 Order 表：今天有哪些预约的手术/引产（status = scheduled, scheduled_time = 今天）
4. 查 OBProfile 表：有没有预产期就在今天附近的产妇（edd 在 ±2 天内）
5. 查 Alert 表：有没有未确认的预警（acknowledged = false）

**涉及表**：Admission、Bed、Room、OBProfile、Order、Alert（全部只读）

**不涉及 Lambda**：纯读操作

**Agent 回答示例**：

> "目前 12 个在院产妇，3 间产后恢复室今天可能空出来。上午 10 点有一台预约剖腹产（张XX），下午有 2 个引产。另外，李XX 预产期是明天，目前 38+6 周，随时可能来。还有一条未确认的预警：刘XX 的血压趋势上升。"

**可选操作**：护士可以要求生成交接报告 → 触发 `generate-report` Lambda → 返回下载链接。

---

### 5.2 场景二：房间调度 —— "还有房间吗？"

**触发**：急诊来了临产产妇，或需要转床

**Agent 执行流程**：

1. 查 Bed + Room 表：当前所有 available 的床位，按 room_type 分类
2. 如果没有空床，查 Admission + LaborProgress：
   - 找到当前待产室里产程最接近分娩的产妇（cervical_dilation_cm 最大、变化速度最快）
   - 基于产程进展趋势，预测该产妇何时转产房，从而腾出待产室
3. 综合以上信息，给出推荐方案

**涉及表**：

| 操作 | 表 |
|------|------|
| 读 | Bed、Room、Admission、LaborProgress |
| 写 | Bed（更新 status 和 current_admission_id）、Admission（更新 current_bed_id） |

**涉及 Lambda**：`assign-bed`

**Agent 回答示例**：

> "待产室目前满了。但 203 房的王XX 已经开到 8cm，预计 1-2 小时内转产房，到时候待产室就空了。205 房的赵XX 是引产第一天，短时间内不会空。建议先安排临时观察区，优先等 203。要我现在就把 triage-01 分配给新来的产妇吗？"

护士确认后，Agent 调用 `assign-bed` Lambda。

---

### 5.3 场景三：住院时长预测 —— "她大概住几天？"

**触发**：护士询问某产妇的预计出院时间

**Agent 执行流程**：

1. 查 OBProfile：分娩方式、胎数、合并症、孕周等
2. 查 Admission：当前状态、实际分娩方式（如已分娩）
3. 查 LaborProgress：产程进展（如还在待产中）
4. 基于以上信息调用预测逻辑，核心规则如下：

**住院时长预测规则（基于临床经验的规则引擎）**：

| 情况 | 基准住院时长 | 调整因素 |
|------|-------------|----------|
| 顺产，无合并症 | 24-48 小时 | 初产妇偏长（48h），经产妇偏短（24h） |
| 剖腹产，无合并症 | 72-96 小时 | |
| 双胎 | 基准 ×1.5 | |
| 有合并症 | 基准 +24-48 小时 | 视合并症严重程度 |
| NICU 需求 | 基准 +48-72 小时 | 早产儿需要观察 |

5. 将预测结果写回 Admission 表

**涉及表**：

| 操作 | 表 |
|------|------|
| 读 | OBProfile、Admission、LaborProgress |
| 写 | Admission（predicted_los_hours, predicted_discharge_time） |

**涉及 Lambda**：`update-prediction`

**Agent 回答示例**：

> "陈XX 刚做完剖腹产，第一胎，无合并症。根据她的情况，预计术后第 3 天可以出院，也就是周四。我已经把预计出院时间更新到系统了。"

---

### 5.4 场景四：高危预警 —— "谁需要特别注意？"

**触发**：护士主动询问，或 Agent 在其他查询中发现异常主动提醒

**Agent 执行流程**：

1. 查 Admission：所有在院产妇（status ≠ discharged）
2. 查 OBProfile：risk_level = high 或有 complications 的产妇
3. 查 VitalSign：每个产妇最近若干条记录，分析趋势
4. 预警判断规则：

**预警触发规则**：

| 指标 | warning 阈值 | critical 阈值 |
|------|-------------|---------------|
| 收缩压 bp_systolic | ≥ 140 | ≥ 160 |
| 舒张压 bp_diastolic | ≥ 90 | ≥ 110 |
| 胎心率 fetal_heart_rate | < 110 或 > 160 | < 100 或 > 180 |
| 体温 temperature | ≥ 37.8 | ≥ 38.5 |
| 趋势预警 | 连续 3 次同方向变化 | 连续 5 次同方向变化 |

5. 发现异常 → 生成预警记录

**涉及表**：

| 操作 | 表 |
|------|------|
| 读 | Admission、OBProfile、VitalSign |
| 写 | Alert |

**涉及 Lambda**：`create-alert`

**Agent 回答示例**：

> "两个要注意：刘XX，妊娠高血压，今早血压有上升趋势（130 → 138 → 145），建议增加监测频率。周XX，双胎 34 周，有早产风险，NICU 那边确认过还有 2 个空位。我已经生成了预警记录。"

---

### 5.5 场景五：下医嘱 —— "帮我预约手术"

**触发**：护士要求创建医嘱（预约剖腹产、引产、化验等）

**Agent 执行流程**：

1. 解析护士的自然语言请求，提取：order_type、目标产妇、期望时间
2. 查 Admission：确认产妇在院
3. 查 Shift 表：目标时间段有哪些医生在班
4. 按 order_type 确定所需人员：
   - 剖腹产：需要 attending + anesthesiologist
   - 引产：需要 attending 或 midwife
   - 化验：无需检查排班
5. 查 Order 表：目标医生在该时段有没有已排的手术（冲突检测）
6. 查 Room 表：需要产房的手术，确认产房可用性
7. 汇总信息，向护士确认
8. 护士确认后，调用 `create-order` Lambda

**涉及表**：

| 操作 | 表 |
|------|------|
| 读 | Admission、Shift、Provider、Order、Room |
| 写 | Order |

**涉及 Lambda**：`create-order`

**Agent 对话流程示例**：

> 护士："帮我给 203 房的王XX 预约明天上午的剖腹产。"
>
> Agent："好的，我查了一下明天白班的排班：Dr. Smith（主刀）和 Dr. Lee（麻醉）都有空。产房 1 号明天上午 9 点到 11 点可用。帮你预约明天上午 9 点，产房 1 号，可以吗？"
>
> 护士："可以。"
>
> Agent：调用 `create-order` Lambda → "已经预约好了。主刀 Dr. Smith，麻醉 Dr. Lee，明天上午 9 点，产房 1 号。需要我同时通知麻醉科吗？"

---

## 六、Lambda 设计

### 6.1 总览

共 **5 个 Lambda**，全部用 Python 编写，通过 CDK 部署。

| Lambda 名称 | 触发方式 | 功能 |
|-------------|---------|------|
| `assign-bed` | Agent boto3 invoke | 分配/转换床位 |
| `update-prediction` | Agent boto3 invoke | 写入住院时长预测值 |
| `create-alert` | Agent boto3 invoke | 创建高危预警记录 |
| `create-order` | Agent boto3 invoke | 创建医嘱/手术单 |
| `generate-report` | Agent boto3 invoke | 生成报告 → 写 S3 → 返回 Presigned URL |

### 6.2 Agent Tool 调用方式

Agent 中每个写操作 Tool 的本质是一个 `boto3.invoke()` 的封装：

```python
# 伪代码 — Agent Tool 定义

@tool
def assign_bed(admission_id: str, bed_id: str) -> dict:
    """分配或转换床位"""
    return lambda_client.invoke(
        FunctionName="assign-bed",
        Payload=json.dumps({"admission_id": admission_id, "bed_id": bed_id})
    )

@tool
def create_order(admission_id: str, order_type: str, provider_id: str, scheduled_time: str, room_id: str = None, priority: str = "routine") -> dict:
    """创建医嘱"""
    return lambda_client.invoke(
        FunctionName="create-order",
        Payload=json.dumps({...})
    )

@tool
def db_query(sql: str) -> dict:
    """直接读取数据库（只读）— 不走 Lambda"""
    return neon_connection.execute(sql)
```

**关键区分：`db_query` 是直连 NeonDB（只读），其他 Tool 都是 invoke Lambda。**

### 6.3 各 Lambda 详细设计

---

#### Lambda 1：`assign-bed`

**输入参数**：

```json
{
  "admission_id": "uuid",
  "bed_id": "uuid"
}
```

**校验逻辑（按顺序执行，任一失败则拒绝）**：

1. 查 Bed 表：目标床位的 status 是否为 `available`？（防并发冲突）
2. 查 Bed + Room 表：目标床位的 room_type 与产妇当前状态是否匹配？
   - status = admitted/in_labor → 只能分配 labor 或 triage 类型房间
   - status = delivered/postpartum → 只能分配 postpartum 类型房间
   - 不能把待产的人分到 NICU
3. 查 OBProfile：如果产妇 risk_level = high，不能分配到离护士站最远的房间（可通过 room 的 floor/room_number 判断）

**写入操作（校验全部通过后）**：

1. 如果产妇之前有床位（转床场景）：
   - 旧 Bed：status → available，current_admission_id → NULL
2. 新 Bed：status → occupied，current_admission_id → admission_id
3. Admission：current_bed_id → bed_id

**返回**：

```json
{
  "success": true,
  "message": "已将 [患者姓名] 分配到 [房间号]-[床位号]"
}
```

或失败：

```json
{
  "success": false,
  "reason": "该床位已被占用"
}
```

---

#### Lambda 2：`update-prediction`

**输入参数**：

```json
{
  "admission_id": "uuid",
  "predicted_los_hours": 72,
  "predicted_discharge_time": "2026-02-15T10:00:00Z"
}
```

**校验逻辑**：

1. 查 Admission：status 是否不为 `discharged`？（已出院的不能再更新预测）
2. predicted_los_hours 是否在合理范围内？（6 - 336 小时，即 0.25 天 - 14 天。超出范围 → 拒绝写入，可能是 AI 幻觉）
3. predicted_discharge_time 是否在 admit_time 之后？

**写入操作**：

1. Admission：predicted_los_hours → 新值，predicted_discharge_time → 新值

**返回**：成功/失败 + 消息

---

#### Lambda 3：`create-alert`

**输入参数**：

```json
{
  "admission_id": "uuid",
  "alert_type": "high_bp",
  "severity": "warning",
  "message": "收缩压连续 3 次上升：130 → 138 → 145，建议增加监测频率"
}
```

**校验逻辑**：

1. 查 Admission：该产妇是否仍在院？
2. 查 Alert 表：同一个 admission_id + 同一个 alert_type 在过去 1 小时内是否已经有记录？（防重复报警）
3. severity 与 alert_type 的合理性检查：
   - alert_type = high_bp 且 severity = critical → 检查最新 bp_systolic 是否真的 ≥ 160
   - 如果实际值不支持该 severity，降级为 warning

**写入操作**：

1. 插入一条 Alert 记录，triggered_at = 当前时间，acknowledged = false

**返回**：成功/失败 + alert_id

---

#### Lambda 4：`create-order`

**输入参数**：

```json
{
  "admission_id": "uuid",
  "order_type": "c_section",
  "scheduled_time": "2026-02-13T09:00:00Z",
  "assigned_provider_id": "uuid",
  "assigned_room_id": "uuid (可选)",
  "priority": "routine",
  "notes": ""
}
```

**校验逻辑**：

1. 查 Admission：产妇是否在院？
2. 查 Shift 表：该 provider 在 scheduled_time 对应的日期是否有班？
3. 查 Order 表：该 provider 在 scheduled_time ± 2 小时内是否已有其他手术？（冲突检测）
4. 如果 order_type = c_section：
   - 必须同时验证有 attending 和 anesthesiologist 可用（Agent 应在调用前确认，Lambda 做二次校验）
5. 如果有 assigned_room_id：该 Room 在该时段是否被其他 Order 占用？
6. 优先级规则：emergency 可以覆盖 routine，但 routine 不能覆盖已有的 urgent/emergency

**写入操作**：

1. 插入一条 Order 记录，status = scheduled，created_by = "ai_assisted"

**返回**：成功/失败 + order_id

---

#### Lambda 5：`generate-report`

**输入参数**：

```json
{
  "report_type": "shift_handover",
  "content": "## 今日班次交接报告\n\n### 在院产妇总览\n...(Agent 生成的 Markdown 内容)",
  "requesting_nurse_id": "uuid"
}
```

**支持的 report_type**：

| report_type | 说明 | 典型触发场景 |
|-------------|------|-------------|
| shift_handover | 班次交接报告 | 场景1，早班/夜班开始 |
| bed_utilization | 床位周转日报 | 护士长要看的运营数据 |
| patient_risk_summary | 高危产妇监控摘要 | 场景4，某产妇触发预警后 |
| surgery_schedule | 手术排程表 | 场景5，下完医嘱后 |

**执行流程**：

1. 将 Markdown 内容渲染为最终文件
2. 上传到 S3：`s3://materni-flow-reports/{date}/{report_type}_{timestamp}.md`
3. 生成 Presigned URL，过期时间 = 24 小时
4. 返回 URL

**S3 安全设计**：

- Bucket 开启服务端加密（SSE-S3）
- Presigned URL 有效期 24 小时，过期后无法访问
- Lambda 的 IAM Role 只有对该特定 Bucket 的 PutObject 和 GetObject 权限

**返回**：

```json
{
  "success": true,
  "download_url": "https://materni-flow-reports.s3.amazonaws.com/...?X-Amz-Signature=...",
  "expires_in_hours": 24
}
```

---

## 七、Agent Lambda 设计

### 7.1 运行环境

Agent Lambda 是整个系统的"大脑"，运行 Strands Agents SDK。

- **Runtime**：Python 3.12
- **内存**：至少 512MB（推荐 1024MB）
- **超时**：300 秒（5分钟，因为 LLM 推理 + 多次 tool calling 可能较慢）
- **环境变量**：NeonDB 连接字符串、Bedrock 模型 ID、其他 Lambda 函数名

### 7.2 Agent 的 Tool 清单

| Tool 名称 | 类型 | 说明 |
|-----------|------|------|
| `db_query` | 直连 NeonDB | 执行只读 SQL，返回查询结果 |
| `assign_bed` | invoke Lambda | 分配/转换床位 |
| `update_prediction` | invoke Lambda | 写入住院时长预测 |
| `create_alert` | invoke Lambda | 创建高危预警 |
| `create_order` | invoke Lambda | 创建医嘱 |
| `generate_report` | invoke Lambda | 生成报告，返回下载链接 |

共 **6 个 Tool**：1 个直读 + 5 个 invoke Lambda。

### 7.3 Agent System Prompt 设计要点

Agent 的 system prompt 需要包含以下信息（开发时根据实际情况编写）：

1. **角色定义**：你是妇产科病房的 AI 调度助手，服务对象是护士
2. **数据库 schema 描述**：11 张表的名称、关键字段、关系（让 LLM 知道该查哪张表）
3. **状态机说明**：Admission 的 status 流转规则
4. **预测规则**：住院时长的基准规则（见场景3）
5. **预警规则**：各指标的阈值（见场景4）
6. **安全约束**：
   - 所有写操作必须先向护士确认，得到明确同意后再执行
   - 不得编造不存在的数据
   - 如果不确定，告诉护士需要人工确认

---

## 八、前端设计

### 8.1 页面结构

| 页面 | 功能 |
|------|------|
| 登录页 | 护士用工号登录 |
| 聊天主界面 | 与 AI Agent 对话 |
| 侧边栏（可选） | 当前在院产妇快览、未确认预警提示 |

### 8.2 聊天界面核心功能

- 消息输入框 + 发送按钮
- 消息列表（护士消息 + Agent 回复）
- Agent 回复中可能包含：
  - 纯文本回答
  - 结构化数据（表格形式展示产妇列表、房间状态等）
  - 操作确认请求（"要我帮你分配床位吗？"→ 确认/取消按钮）
  - 报告下载链接（Presigned URL）
- 流式输出（Agent 的回复逐步显示）

### 8.3 前端 → BFF → Agent 的调用链

```
Next.js 页面
  → fetch("/api/chat", { message: "..." })
    → FastAPI /chat 端点
      → boto3.invoke("agent-lambda", { message, session_id, nurse_id })
        → Agent Lambda 处理
      ← 返回结果
    ← 返回前端
  ← 渲染消息
```

---

## 九、基础设施（CDK）

### 9.1 CDK 管理的资源

| 资源 | 说明 |
|------|------|
| Lambda × 6 | 1 个 Agent Lambda + 5 个写操作 Lambda |
| S3 Bucket × 1 | 报告存储，开启 SSE-S3 加密 |
| IAM Role × 2 | Agent Lambda Role（Bedrock 调用权限 + invoke 其他 Lambda 权限）、写操作 Lambda Role（NeonDB 写权限 + S3 写权限） |

### 9.2 CDK 不管理的资源

| 资源 | 管理方式 |
|------|----------|
| NeonDB | NeonDB 控制台手动创建 |
| Vercel 部署 | Vercel CLI / GitHub 集成 |

### 9.3 IAM 权限设计

**Agent Lambda Role**：

- `bedrock:InvokeModel`（调用 LLM）
- `lambda:InvokeFunction`（调用 5 个写操作 Lambda）
- NeonDB 只读连接（通过环境变量中的连接字符串，使用只读数据库用户）

**写操作 Lambda Role（5 个共享同一 Role 或各自独立，推荐独立）**：

- NeonDB 读写连接（使用有写权限的数据库用户）
- `generate-report` Lambda 额外需要：`s3:PutObject`、`s3:GetObject` on `materni-flow-reports/*`

---

## 十、Dummy Data 生成方案

### 10.1 数据规模

| 表 | 建议数量 | 说明 |
|------|----------|------|
| Patient | 50 | 足够展示多样性 |
| OBProfile | 50 | 与 Patient 1:1 |
| Room | 20 | 含各种 room_type |
| Bed | 30 | 待产室/产房单床，恢复室多床 |
| Provider | 15 | 含各种 role |
| Shift | 45 | 3 天的排班（每天 15 人 × day/night） |
| Admission | 15 | 当前在院的产妇，覆盖各种 status |
| LaborProgress | 60 | 每个 in_labor 的产妇 4-8 条记录 |
| VitalSign | 90 | 每个在院产妇 6 条记录（每 4 小时一次） |
| Order | 10 | 今明两天的预约手术 |
| Alert | 3 | 2 条未确认 + 1 条已确认 |

### 10.2 生成要点

- **LaborProgress 和 VitalSign 是时间序列**：必须生成多条、有时间间隔、数值有合理变化趋势（不能随机跳变）
- **至少安排 2 个高危产妇**：一个血压趋势上升，一个双胎早产风险，用于演示场景4
- **至少 1 个产妇处于 in_labor 且产程过半**（宫颈扩张 7-8cm），用于演示场景2 的"预计何时腾房间"
- **床位不要全满**：保留 2-3 个 available 的床，也保留 2-3 个 cleaning 的床，体现真实感
- **明天要有 1 台预约剖腹产**：用于演示场景5

---

## 十一、演示脚本（2 分钟）

| 时间 | 动作 | 展示重点 |
|------|------|----------|
| 0:00 | 护士登录，输入"今天病房什么情况？" | 场景1：Agent 聚合查询，返回全局视图 |
| 0:20 | 追问"谁需要特别注意？" | 场景4：Agent 分析 VitalSign 趋势，生成预警 |
| 0:40 | "急诊来了一个临产的，有空的待产室吗？" | 场景2：Agent 查空床 + 预测产程 |
| 1:00 | 确认分配床位 | Agent 调用 assign-bed Lambda，展示写操作安全边界 |
| 1:10 | "203 房的王XX 做完剖腹产了，预计什么时候能出院？" | 场景3：Agent 预测住院时长 |
| 1:30 | "帮我给李XX 预约明天上午的剖腹产" | 场景5：Agent 查排班 + 创建医嘱 |
| 1:50 | "帮我生成一份今日交接报告" | S3 报告生成 + Presigned URL 下载 |

---

## 十二、面试亮点提炼

### 可以主动讲的架构决策

1. **AI 安全边界设计**：Agent 只读，写操作通过独立 Lambda 执行，Lambda 有独立校验。即使 AI 判断错误，Lambda 也能拦住。
2. **Tool Calling 实战**：Agent 有 6 个 Tool，1 个直读数据库 + 5 个 invoke Lambda，展示了 AI Agent 与外部系统集成的完整模式。
3. **Lambda 校验逻辑**：不是无脑转发，每个 Lambda 都有业务规则校验（如并发控制、预测值合理性检查、重复预警防护、排班冲突检测）。
4. **Presigned URL**：前端不直连 S3，权限可控，URL 有过期时间。结合 SSE-S3 加密，符合医疗数据安全要求。
5. **CDK 基础设施即代码**：所有 AWS 资源通过 CDK 定义和部署，可复现。

### 如果被追问可以展开的话题

1. **为什么不把写操作直接放在 Agent Lambda 里？** → 安全性 + 单一职责 + 独立部署独立测试
2. **为什么用规则引擎而不是 ML 模型预测住院时长？** → 医疗领域需要可解释性，规则引擎的预测逻辑对护士透明，而且 dummy data 不足以训练可靠模型
3. **如何处理并发？** → assign-bed Lambda 中先检查 Bed.status，使用数据库事务保证原子性
4. **为什么 Room 和 Bed 分开？** → 产后恢复室是多人间，待产室是单人间，不分开无法准确算容量
5. **数据是 fake 的，怎么体现真实感？** → 虚构场景但遵循真实的临床规则（住院时长基准、预警阈值都基于实际临床指南）
