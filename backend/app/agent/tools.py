from typing import List, Dict, Any, Tuple
from app.services.supabase_service import supabase_service

async def fetch_nearby_hospitals(specialty: str) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Skill: Queries the Supabase 'hospitals' table to return up to 3 matching
    24/7 facilities for a given specialty.
    """
    return await supabase_service.get_nearby_24_7_hospitals(specialty=specialty, limit=3)

def generate_sbar_handover(symptoms: str, specialty: str, urgency: str) -> str:
    """
    Skill: Formats patient's distress signal into a highly concise SBAR
    (Situation, Background, Assessment, Recommendation) string for ER staff.
    NON-DIAGNOSTIC compliant.
    """
    sbar = (
        f"[S] SITUATION: Emergency intake reporting {symptoms.strip()}.\n"
        f"[B] BACKGROUND: Pre-hospital emergency signal received via CareBridge dispatch.\n"
        f"[A] ASSESSMENT: Triage Urgency Level is {urgency.upper()}. Indicated Specialty Support: {specialty}. (Non-diagnostic clinical classification).\n"
        f"[R] RECOMMENDATION: Prepare emergency bay, alert on-duty {specialty} specialist team, and ready critical care triage suite immediately."
    )
    return sbar
