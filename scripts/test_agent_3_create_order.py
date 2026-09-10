# -*- coding: utf-8 -*-

"""
Test script for the BI Agent - create_order tool.

This script tests multi-turn conversations for creating medical orders.

Usage:
    .venv/bin/python scripts/test_agent_3_create_order.py
"""


from learn_materniflow.one.api import one
from learn_materniflow.tests.db_sync import reset_remote_database
from learn_materniflow.agent_debugger import chat
from learn_materniflow.agent_debugger import print_summary
from learn_materniflow.agent_debugger import print_multi_turn_conversation_headers


def test_create_order_full(debug: bool = False):
    """Test create_order with 3-turn conversation: Query -> Execute -> Verify."""
    # Get agent and clear history
    agent = one.agent
    agent.messages.clear()

    results = []

    # Turn 1: Query - Find a patient and an available provider
    request_01 = """
I need to schedule a C-section for a patient. Please find:
1. A patient currently in labor status (show admission_id, patient name, current status)
2. An attending physician (show provider_id, name, role - role should be 'attending')
3. A delivery room (show room_id, room_number, room_type - type should be 'delivery')
""".strip()

    thinking, answer = chat(agent, request_01, turn_number=1, debug=debug)
    results.append(("Query", thinking, answer))

    # Turn 2: Execute - Create the medical order
    request_02 = """
Good. Now schedule a C-section for the first labor patient you found.

Use the create_order tool with these exact parameters:
- admission_id: the first labor patient's admission_id
- order_type: "c_section"
- scheduled_time: "2026-02-20T09:00:00" (tomorrow at 9:00 AM)
- assigned_provider_id: the first attending physician's provider_id
- assigned_room_id: the first delivery room's room_id
- priority: "routine"
- notes: "Scheduled C-section, patient stable"

Please proceed with calling the create_order tool now.
""".strip()

    thinking, answer = chat(agent, request_02, turn_number=2)
    results.append(("Execute", thinking, answer))

    # Turn 3: Verify - Confirm the order was created
    request_03 = """
Verify the order was created successfully. Query the medical_order table to show:
1. The order_id and order_type
2. The patient's admission_id
3. The scheduled_time
4. The assigned provider's name
5. The assigned room (if any)
6. The order status and priority
""".strip()

    thinking, answer = chat(agent, request_03, turn_number=3)
    results.append(("Verify", thinking, answer))

    return results


if __name__ == "__main__":
    reset_remote_database(verbose=False)
    print_multi_turn_conversation_headers(name="create_order", n_turns=3)
    results = test_create_order_full(debug=False)
    print_summary(results)
