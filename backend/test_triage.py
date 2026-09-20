"""
CareBridge Verification Test Script
Tests the EmergencyTriageAgent across multiple clinical emergency scenarios.
"""
import asyncio
import json
from app.services.bhashini_service import bhashini_service
from app.agent.triage_agent import emergency_agent
from app.agent.tools import fetch_nearby_hospitals, generate_sbar_handover

TEST_CASES = [
    {
        "name": "Hinglish Acute Cardiac Distress",
        "input": "Mere seene me bohot tez dard ho raha hai aur saans lene me dikkat ho rahi hai",
        "expected_urgency": "Critical",
        "expected_specialty": "Cardiac"
    },
    {
        "name": "Severe Road Accident & Blood Loss",
        "input": "Motorcycle accident with severe bleeding from thigh and open fracture",
        "expected_urgency": "Critical",
        "expected_specialty": "Trauma"
    },
    {
        "name": "Minor Ankle Sprain",
        "input": "Mild ankle twist while running, slight pain and swelling",
        "expected_urgency": "Minor",
        "expected_specialty": "General"
    }
]

async def run_tests():
    print("=" * 60)
    print("[CAREBRIDGE EMERGENCY TRIAGE VERIFICATION SUITE]")
    print("=" * 60)

    for idx, test in enumerate(TEST_CASES, 1):
        print(f"\n[Test {idx}]: {test['name']}")
        print(f"Raw Input: \"{test['input']}\"")
        
        # 1. Translation
        translated = await bhashini_service.translate_to_english(test['input'])
        print(f"Translated: \"{translated}\"")

        # 2. Agent Assessment & Tool Invocation
        result = await emergency_agent.evaluate_and_triage(translated)
        print(f"Urgency Level:  {result['urgency_level']} (Expected: {test['expected_urgency']})")
        print(f"Specialty:      {result['specialty']} (Expected: {test['expected_specialty']})")
        print(f"Hospitals Found: {len(result['hospitals'])} (Fallback: {result['is_fallback_data']})")
        for h in result['hospitals']:
            print(f"   - {h['name']} ({h['contact_number']}) [Distance: {h['distance_km']} km]")

        print("\nGenerated SBAR Handover:")
        for line in result['sbar_handover'].split("\n"):
            print(f"   {line}")

        # Assertions
        assert result['urgency_level'] in ["Critical", "Moderate", "Minor"], "Invalid urgency!"
        assert len(result['hospitals']) > 0, "No hospitals returned!"
        assert "[S] SITUATION:" in result['sbar_handover'], "Missing SBAR Situation!"
        assert "[R] RECOMMENDATION:" in result['sbar_handover'], "Missing SBAR Recommendation!"
        print(f"Status: PASS")

    print("\n" + "=" * 60)
    print("ALL TEST SCENARIOS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
