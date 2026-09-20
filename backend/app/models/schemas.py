from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field

class SbarObject(BaseModel):
    situation: str
    background: str
    assessment: str
    recommendation: str

class TriageRequest(BaseModel):
    transcribed_text: Optional[str] = Field(None, description="Emergency voice/text transcript in Hindi, Hinglish, or English")
    inputText: Optional[str] = Field(None, description="Alternative field name used in React frontend")
    languageCode: Optional[str] = Field("hi", description="Language hint (hi, en, ta, te)")

    def get_query_text(self) -> str:
        return (self.transcribed_text or self.inputText or "").strip()

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
    # React Frontend compatibility fields
    triageLevel: int = 1
    triageCategory: str = "Immediate / Critical"
    requiredSpecialties: List[str] = []
    keySignals: List[str] = []
    sbar: Optional[SbarObject] = None
    safetyDisclaimer: Optional[str] = None
