# -*- coding: utf-8 -*-

"""
Test script for the BI Agent - create_alert tool.

This script tests multi-turn conversations for creating high-risk alerts.

Usage:
    .venv/bin/python scripts/test_agent_4_create_alert.py
"""


from learn_materniflow.one.api import one
from learn_materniflow.tests.db_sync import reset_remote_database
from learn_materniflow.agent_debugger import chat
from learn_materniflow.agent_debugger import print_summary
from learn_materniflow.agent_debugger import print_multi_turn_conversation_headers


def test_create_alert_full(debug: bool = False):
    """Test create_alert with 3-turn conversation: Query -> Execute -> Verify."""
    # Get agent and clear history
    agent = one.agent
    agent.messages.clear()

    results = []

    # Turn 1: Query - Find a patient with concerning vital signs
    request_01 = """
I need to create a high-risk alert for a patient. Please find:
1. A patient currently in labor status (show admission_id, patient name, current status)
2. Their recent vital signs (show blood pressure, heart rate if available)
""".strip()

    thinking, answer = chat(agent, request_01, turn_number=1, debug=debug)
    results.append(("Query", thinking, answer))

    # Turn 2: Execute - Create the alert
    request_02 = """
The first patient's blood pressure is concerning and trending upward.

Use the create_alert tool with these exact parameters:
- admission_id: the first labor patient's admission_id
- alert_type: "high_bp"
- severity: "warning"
- message: "Blood pressure trending upward, needs monitoring"

Please proceed with calling the create_alert tool now.
""".strip()

    thinking, answer = chat(agent, request_02, turn_number=2)
    results.append(("Execute", thinking, answer))

    # Turn 3: Verify - Confirm the alert was created
    request_03 = """
Verify the alert was created successfully. Query the alert table to show:
1. The alert_id and alert_type
2. The patient's admission_id
3. The severity and message
4. The alert status (acknowledged or not)
5. The created_at timestamp
""".strip()

    thinking, answer = chat(agent, request_03, turn_number=3)
    results.append(("Verify", thinking, answer))

    return results


if __name__ == "__main__":
    reset_remote_database(verbose=False)
    print_multi_turn_conversation_headers(name="create_alert", n_turns=3)
    results = test_create_alert_full(debug=False)
    print_summary(results)
