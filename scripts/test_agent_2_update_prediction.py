# -*- coding: utf-8 -*-

"""
Test script for the BI Agent - update_prediction tool.

This script tests multi-turn conversations for updating LOS predictions.

Usage:
    .venv/bin/python scripts/test_agent_2_update_prediction.py
"""


from learn_materniflow.one.api import one
from learn_materniflow.tests.db_sync import reset_remote_database
from learn_materniflow.agent_debugger import chat
from learn_materniflow.agent_debugger import print_summary
from learn_materniflow.agent_debugger import print_multi_turn_conversation_headers


def test_update_prediction_full(debug: bool = False):
    """Test update_prediction with 3-turn conversation: Query -> Execute -> Verify."""
    # Get agent and clear history
    agent = one.agent
    agent.messages.clear()

    results = []

    # Turn 1: Query - Find a postpartum patient and their current prediction
    request_01 = """
I need to update the discharge prediction for a patient. Please find:
1. A patient in postpartum status (show admission_id, patient name, admission_time, current status)
2. Their current predicted_los_hours and predicted_discharge_time values (if any)
""".strip()

    thinking, answer = chat(agent, request_01, turn_number=1, debug=debug)
    results.append(("Query", thinking, answer))

    # Turn 2: Execute - Update the prediction
    # The nurse assessed the patient is recovering well, estimate 24 more hours
    request_02 = """
The patient is recovering well. Based on clinical assessment, I estimate she can be discharged in about 24 hours from now.

Please use the update_prediction tool to update the first postpartum patient:
- Set predicted_los_hours to 24
- Set predicted_discharge_time to 24 hours from now (use ISO format like 2024-01-15T14:00:00)
""".strip()

    thinking, answer = chat(agent, request_02, turn_number=2)
    results.append(("Execute", thinking, answer))

    # Turn 3: Verify - Confirm the update was applied
    request_03 = """
Verify the prediction update was successful. Query the admission table to show:
1. The patient's admission_id and name
2. The new predicted_los_hours value
3. The new predicted_discharge_time value
""".strip()

    thinking, answer = chat(agent, request_03, turn_number=3)
    results.append(("Verify", thinking, answer))

    return results


if __name__ == "__main__":
    reset_remote_database(verbose=False)
    print_multi_turn_conversation_headers(name="update_prediction", n_turns=3)
    results = test_update_prediction_full(debug=False)
    print_summary(results)
