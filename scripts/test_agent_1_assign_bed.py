# -*- coding: utf-8 -*-

"""
Test script for the BI Agent with Write Operations.

This script tests multi-turn conversations with the agent.
"""

from learn_materniflow.one.api import one
from learn_materniflow.tests.db_sync import reset_remote_database
from learn_materniflow.agent_debugger import chat
from learn_materniflow.agent_debugger import print_summary
from learn_materniflow.agent_debugger import print_multi_turn_conversation_headers


def test_assign_bed_full(debug: bool = False):
    """Test assign_bed with 3-turn conversation: Query -> Execute -> Verify."""
    # Get agent and clear history
    agent = one.agent
    agent.messages.clear()

    results = []

    # Turn 1: Query - Find a patient with bed and an available postpartum bed
    request_01 = """
I need to transfer a patient to a different bed. Please find:
1. A patient who currently HAS a bed assigned (show admission_id, patient name, bed_label, room_number)
2. An available bed in postpartum area (show bed_id, bed_label, room_number)
""".strip()

    thinking, answer = chat(agent, request_01, turn_number=1, debug=debug)
    results.append(("Query", thinking, answer))

    # Turn 2: Execute - Transfer the patient using assign_bed tool
    request_02 = """
Good. Now transfer the first patient you found to the first available postpartum bed.
Use the assign_bed tool.
""".strip()

    thinking, answer = chat(agent, request_02, turn_number=2)
    results.append(("Execute", thinking, answer))

    # Turn 3: Verify - Confirm the transfer was successful
    request_03 = """
Verify the transfer was successful. Check:
1. The patient's new bed assignment
2. The old bed is now available
3. The new bed is now occupied
""".strip()

    thinking, answer = chat(agent, request_03, turn_number=3)
    results.append(("Verify", thinking, answer))

    return results


if __name__ == "__main__":
    reset_remote_database(verbose=False)
    print_multi_turn_conversation_headers(name="assign_bed", n_turns=3)
    results = test_assign_bed_full(debug=False)
    print_summary(results)
