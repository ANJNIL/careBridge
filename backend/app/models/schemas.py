from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class TriageRequest(BaseModel):
    transcribed_text: str = Field(..., description="Emergency voice/text transcript in Hindi, Hinglish, or English")

class HospitalInfo(BaseModel):
    id: str
    name: str
    address: str
    contact_number: str
    is_24_7_open: bool
    specialties: List[str]
    distance_km: float

class TriageResponse(BaseModel):
    original_text: str
    translated_text: str
    urgency_level: Literal["Critical", "Moderate", "Minor"]
    specialty: str
    hospitals: List[HospitalInfo]
    sbar_handover: str
    is_fallback_data: bool = False
    disclaimer: str = (
        "NON-DIAGNOSTIC ADVISORY: CareBridge assists in emergency routing and triage prioritization only. "
        "It does not provide medical diagnoses or replace licensed clinical evaluation."
    )
