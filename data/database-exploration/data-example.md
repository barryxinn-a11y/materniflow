# Database Exploration - Data Examples

## admission

**Schema:** 13 columns

| admission_id | patient_id | ob_id | admit_time | status | delivery_method_actual | delivery_time | predicted_los_hours | predicted_discharge_time | actual_discharge_time | current_bed_id | attending_provider_id | primary_nurse_id |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| b3d81911-2a3e-41f7-a28b-143... | c044b754-ebd0-4f48-8975-56a... | e25b671e-b964-4cdc-983f-ac8... | 2026-02-13 00:00:00.000000 | in_labor | NULL | NULL | NULL | NULL | NULL | 2119efa0-e2c2-4e58-9e13-00e... | ce614920-1e58-417e-800c-8a8... | 34d5f918-fbaa-4bd7-b478-4be... |
| 2f10155e-b6db-42cb-87f7-d02... | 6d2616b7-735b-401b-9bd6-ea7... | a634cc77-5115-4221-81e8-803... | 2026-02-13 02:00:00.000000 | in_labor | NULL | NULL | NULL | NULL | NULL | f9536d0e-5816-4599-af35-56d... | dfab8630-470c-4a3e-a117-9d1... | 3d60c0f0-a47a-4ef1-8adb-2ee... |
| 01d9e8b9-b99d-43a9-b55d-dcd... | ffaceee8-dd12-4c1f-abab-4d1... | 1f41bbff-3372-4b69-9baf-1a8... | 2026-02-12 20:00:00.000000 | admitted | NULL | NULL | NULL | NULL | NULL | 0fee2129-e736-444b-8a91-fde... | bb0f7f65-914e-4af4-a7e0-214... | 7d0b8455-a02e-49e4-b7ae-77c... |
| f1c6f237-1874-4d21-bd1f-4e5... | 0fe964c4-a3c0-489b-826e-c5f... | cbd2d9c4-5ff2-4d6f-b7af-069... | 2026-02-12 22:00:00.000000 | in_labor | NULL | NULL | NULL | NULL | NULL | 5fbb1096-b0e7-4237-81bb-232... | e43940f6-151c-4122-b884-ade... | 3d60c0f0-a47a-4ef1-8adb-2ee... |
| a49eb757-7f66-4398-8ece-1bd... | e6b69014-5653-4e7e-aacf-983... | 9d7e5369-6758-4cd4-aadc-b76... | 2026-02-11 20:00:00.000000 | postpartum | vaginal | 2026-02-12 02:00:00.000000 | 35 | 2026-02-13 13:00:00.000000 | NULL | c5c80f0b-1725-4f78-a3a8-c8a... | e43940f6-151c-4122-b884-ade... | aad9b5ee-2e1f-42dc-ac29-923... |

## alert

**Schema:** 8 columns

| alert_id | admission_id | alert_type | severity | message | triggered_at | acknowledged | acknowledged_by |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| 028accbf-e96c-4f9c-80bd-5fc... | 9b7b2dd7-1d37-4f87-9240-734... | high_bp | warning | Blood pressure trending upw... | 2026-02-13 06:00:00.000000 | 0 | NULL |
| 2331abbe-0007-439b-b16d-c6e... | b3d81911-2a3e-41f7-a28b-143... | preterm_risk | warning | Twin pregnancy at 34 weeks ... | 2026-02-13 02:00:00.000000 | 1 | 34d5f918-fbaa-4bd7-b478-4be... |

## bed

**Schema:** 5 columns

| bed_id | room_id | bed_label | status | current_admission_id |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| 2119efa0-e2c2-4e58-9e13-00e... | 5695324d-9852-493c-b2c7-46d... | A | occupied | b3d81911-2a3e-41f7-a28b-143... |
| f9536d0e-5816-4599-af35-56d... | 87a3e195-d09e-4fa4-b9ea-440... | A | occupied | 2f10155e-b6db-42cb-87f7-d02... |
| 0fee2129-e736-444b-8a91-fde... | 7686aaf3-26c6-476a-b431-0f9... | A | occupied | 01d9e8b9-b99d-43a9-b55d-dcd... |
| 5fbb1096-b0e7-4237-81bb-232... | bb4f14d4-7a18-41cb-8728-309... | A | occupied | f1c6f237-1874-4d21-bd1f-4e5... |
| c5c80f0b-1725-4f78-a3a8-c8a... | c7736cf3-468a-4fb8-b1a1-4a7... | A | occupied | a49eb757-7f66-4398-8ece-1bd... |

## labor_progress

**Schema:** 9 columns

| progress_id | admission_id | recorded_at | cervical_dilation_cm | effacement_pct | station | contraction_freq | membrane_status | notes |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| 6204fb17-1fbe-4166-ab9b-820... | b3d81911-2a3e-41f7-a28b-143... | 2026-02-13 00:00:00.000000 | 1.9 | 43 | -1 | 2 | intact | NULL |
| c3e32d1f-aba9-401d-bee6-f52... | b3d81911-2a3e-41f7-a28b-143... | 2026-02-13 01:20:00.000000 | 3.1 | 51 | -1 | 3 | intact | NULL |
| b465e42e-421d-4e2c-91a5-d56... | b3d81911-2a3e-41f7-a28b-143... | 2026-02-13 02:40:00.000000 | 4.9 | 64 | 0 | 4 | ruptured | NULL |
| 7e4c672e-a056-4493-bc25-d29... | b3d81911-2a3e-41f7-a28b-143... | 2026-02-13 04:00:00.000000 | 6.3 | 73 | 0 | 5 | ruptured | NULL |
| 9d344dff-823a-444b-98c0-657... | b3d81911-2a3e-41f7-a28b-143... | 2026-02-13 05:20:00.000000 | 7.3 | 81 | 1 | 5 | ruptured | NULL |

## medical_order

**Schema:** 10 columns

| order_id | admission_id | order_type | status | scheduled_time | assigned_provider_id | assigned_room_id | priority | notes | created_by |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| a01ca7d1-4466-4684-9dbe-fe2... | b3d81911-2a3e-41f7-a28b-143... | epidural | in_progress | 2026-02-13 02:00:00.000000 | 2de0e38f-2f92-4ffe-ae36-c89... | NULL | routine | Patient requested epidural | RN Amanda Thompson |
| 822d8000-72bd-4d39-a1c4-4fc... | 01d9e8b9-b99d-43a9-b55d-dcd... | lab_test | completed | 2026-02-12 21:00:00.000000 | e43940f6-151c-4122-b884-ade... | NULL | routine | CBC, Type & Screen | Dr. Emily Foster |
| abf9c28b-3d59-4674-8ba1-422... | f1c6f237-1874-4d21-bd1f-4e5... | epidural | in_progress | 2026-02-13 04:00:00.000000 | 2de0e38f-2f92-4ffe-ae36-c89... | NULL | routine | Patient requested epidural | RN Jessica Martinez |
| 512a1d06-d20a-4aed-bb37-f6a... | a49eb757-7f66-4398-8ece-1bd... | lab_test | completed | 2026-02-11 21:00:00.000000 | e43940f6-151c-4122-b884-ade... | NULL | routine | CBC, Type & Screen | Dr. James Rodriguez |
| ed7b6712-29e0-4327-ab33-3a7... | ce0a598d-e7cb-49c6-811c-47c... | lab_test | completed | 2026-02-11 09:00:00.000000 | dfab8630-470c-4a3e-a117-9d1... | NULL | routine | CBC, Type & Screen | Dr. James Rodriguez |

## ob_profile

**Schema:** 13 columns

| ob_id | patient_id | gravida | para | gestational_weeks | edd | fetus_count | prior_delivery_method | planned_delivery_method | risk_level | complications | gbs_status | notes |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| a9ed5224-322e-412b-9d0e-cde... | 3b2634d5-f0f0-4559-b322-bd6... | 3 | 1 | 41.5 | 2026-02-03 | 3 | vaginal | vaginal | high | NULL | unknown | NULL |
| 27309e44-646d-47e1-b8fc-6af... | a4fd62bd-e84d-4ff8-9763-6a0... | 3 | 0 | 40.6 | 2026-02-09 | 2 | none | vaginal | high | ["Oligohydramnios", "Gestat... | negative | NULL |
| 3606c79e-e346-47bb-aa72-2ea... | 475b498e-0c4a-4f0a-ac40-305... | 4 | 1 | 40.4 | 2026-02-11 | 1 | vaginal | c_section | medium | NULL | positive | NULL |
| 73999c29-3857-4272-813b-4d7... | 3705e8a0-bbd3-410f-9450-01d... | 2 | 1 | 37.6 | 2026-03-01 | 1 | c_section | c_section | high | ["Preeclampsia", "Advanced ... | negative | NULL |
| 937e954e-0512-4d11-a915-8e7... | 75f1821a-06b5-47ff-914d-bc7... | 2 | 0 | 41.9 | 2026-01-31 | 1 | none | vaginal | low | NULL | negative | NULL |

## patient

**Schema:** 6 columns

| patient_id | name | age | phone | emergency_contact | insurance_type |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| 3b2634d5-f0f0-4559-b322-bd6... | Laura Turner | 39 | +1-210-343-3218x1960 | Jonathan Johnson, 886.737.9402 | Medicaid |
| a4fd62bd-e84d-4ff8-9763-6a0... | Nicole Taylor | 30 | 223-951-1615x594 | Valerie Gray, +1-649-359-3103 | commercial |
| 475b498e-0c4a-4f0a-ac40-305... | Sarah Williams | 36 | 516.647.5255 | Melinda Jones, +1-228-732-7... | Medicaid |
| 3705e8a0-bbd3-410f-9450-01d... | Brittany Robinson | 29 | (541)639-5376x7242 | Jessica Silva, (332)887-101... | commercial |
| 75f1821a-06b5-47ff-914d-bc7... | Heather Garcia | 30 | (897)484-8018x4514 | Troy Liu, 282-781-4893x252 | Medicaid |

## provider

**Schema:** 5 columns

| provider_id | name | role | department | is_active |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| dfab8630-470c-4a3e-a117-9d1... | Dr. Michael Chen | attending | Obstetrics & Gynecology | 1 |
| e43940f6-151c-4122-b884-ade... | Dr. Sarah Williams | attending | Obstetrics & Gynecology | 1 |
| ce614920-1e58-417e-800c-8a8... | Dr. James Rodriguez | attending | Obstetrics & Gynecology | 1 |
| bb0f7f65-914e-4af4-a7e0-214... | Dr. Emily Foster | attending | Obstetrics & Gynecology | 1 |
| 0906ca8a-8cbb-4aca-90eb-37e... | Dr. Kevin Park | resident | Obstetrics & Gynecology | 1 |

## room

**Schema:** 4 columns

| room_id | room_number | room_type | floor |
|------------------------------|------------------------------|------------------------------|------------------------------|
| 5695324d-9852-493c-b2c7-46d... | L-201 | labor | 2 |
| 87a3e195-d09e-4fa4-b9ea-440... | L-202 | labor | 2 |
| 7686aaf3-26c6-476a-b431-0f9... | L-203 | labor | 2 |
| bb4f14d4-7a18-41cb-8728-309... | L-204 | labor | 2 |
| c7736cf3-468a-4fb8-b1a1-4a7... | L-205 | labor | 2 |

## shift

**Schema:** 5 columns

| shift_id | provider_id | shift_date | shift_type | assigned_room_ids |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| 5b91c1fa-5860-41cb-9b96-72d... | dfab8630-470c-4a3e-a117-9d1... | 2026-02-13 | day | ["L-201", "L-202", "L-203",... |
| 76a830ce-35c7-4a20-a0a4-ecf... | 3db5ef0f-a937-48ab-9a9e-99e... | 2026-02-13 | day | ["L-206", "L-207"] |
| 980800a0-f816-468f-b346-b73... | aad9b5ee-2e1f-42dc-ac29-923... | 2026-02-13 | day | NULL |
| 7c62401f-712a-43ea-9ba4-6d4... | 7d0b8455-a02e-49e4-b7ae-77c... | 2026-02-13 | day | NULL |
| ba2e4d23-28fa-49b7-8c96-1f4... | 34d5f918-fbaa-4bd7-b478-4be... | 2026-02-13 | day | NULL |

## vital_sign

**Schema:** 9 columns

| vital_id | admission_id | recorded_at | bp_systolic | bp_diastolic | heart_rate | temperature | fetal_heart_rate | oxygen_saturation |
|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|------------------------------|
| 146b4ff3-e820-43cd-b5c7-999... | b3d81911-2a3e-41f7-a28b-143... | 2026-02-13 00:00:00.000000 | 118 | 74 | 73 | 98.7 | 128 | 99.4 |
| 0696a2fc-fc22-4cee-8d92-358... | b3d81911-2a3e-41f7-a28b-143... | 2026-02-13 04:00:00.000000 | 121 | 74 | 83 | 98.2 | 132 | 97.7 |
| dae6f15d-8a55-4382-b638-fce... | 2f10155e-b6db-42cb-87f7-d02... | 2026-02-13 02:00:00.000000 | 117 | 70 | 80 | 98.1 | 146 | 97.0 |
| 83c46719-97df-4d3c-9b75-c71... | 01d9e8b9-b99d-43a9-b55d-dcd... | 2026-02-12 20:00:00.000000 | 112 | 72 | 72 | 98.7 | 127 | 97.7 |
| e99f7631-bfd6-4968-8395-b02... | 01d9e8b9-b99d-43a9-b55d-dcd... | 2026-02-13 00:00:00.000000 | 113 | 77 | 71 | 98.4 | 142 | 98.2 |

