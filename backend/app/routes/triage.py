from fastapi import APIRouter, HTTPException, status
from app.models.schemas import TriageRequest, TriageResponse, HospitalInfo, SbarObject
from app.services.bhashini_service import bhashini_service
from app.agent.triage_agent import emergency_agent

router = APIRouter(tags=["Agent Triage"])

def _parse_sbar_sections(sbar_text: str) -> SbarObject:
    """Parses SBAR text into structured object for frontend components."""
    situation = ""
    background = ""
    assessment = ""
    recommendation = ""
    for line in sbar_text.split("\n"):
        line_clean = line.strip()
        if line_clean.startswith("[S] SITUATION:"):
            situation = line_clean.replace("[S] SITUATION:", "").strip()
        elif line_clean.startswith("[B] BACKGROUND:"):
            background = line_clean.replace("[B] BACKGROUND:", "").strip()
        elif line_clean.startswith("[A] ASSESSMENT:"):
            assessment = line_clean.replace("[A] ASSESSMENT:", "").strip()
        elif line_clean.startswith("[R] RECOMMENDATION:"):
            recommendation = line_clean.replace("[R] RECOMMENDATION:", "").strip()
    return SbarObject(
        situation=situation or sbar_text,
        background=background or "Pre-hospital emergency intake via CareBridge.",
        assessment=assessment or "Triage evaluation completed.",
        recommendation=recommendation or "Immediate emergency room prep."
    )

async def _process_triage(request: TriageRequest) -> TriageResponse:
    query = request.get_query_text()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emergency distress input cannot be empty."
        )

    try:
        # Step 1: Translate via Bhashini Engine
        translated = await bhashini_service.translate_to_english(query)

        # Step 2: Invoke Google Antigravity EmergencyTriageAgent with tool execution
        result = await emergency_agent.evaluate_and_triage(translated)

        # Level mapping: Critical -> 1, Moderate -> 2, Minor -> 3
        level_map = {"Critical": 1, "Moderate": 2, "Minor": 3}
        cat_map = {"Critical": "Immediate / Critical", "Moderate": "Urgent", "Minor": "Non-Urgent"}
        triage_level = level_map.get(result["urgency_level"], 2)
        triage_category = cat_map.get(result["urgency_level"], "Urgent")

        sbar_obj = _parse_sbar_sections(result["sbar_handover"])

        return TriageResponse(
            original_text=query,
            translated_text=translated,
            urgency_level=result["urgency_level"],
            specialty=result["specialty"],
            hospitals=[HospitalInfo(**h) for h in result["hospitals"]],
            sbar_handover=result["sbar_handover"],
            is_fallback_data=result["is_fallback_data"],
            # React Frontend compatibility fields
            triageLevel=triage_level,
            triageCategory=triage_category,
            requiredSpecialties=[result["specialty"], "24/7 Emergency & Critical Care"],
            keySignals=[query],
            sbar=sbar_obj,
            safetyDisclaimer=(
                "NON-DIAGNOSTIC ADVISORY: CareBridge assists in emergency routing and triage prioritization only. "
                "It does not provide medical diagnoses or replace licensed clinical evaluation."
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Emergency triage processing error: {str(e)}"
        )

@router.post(
    "/api/v1/agent/triage",
    response_model=TriageResponse,
    status_code=status.HTTP_200_OK,
    summary="Triage emergency distress transcript (Agentic)"
)
async def triage_emergency_v1(request: TriageRequest):
    return await _process_triage(request)

@router.post(
    "/api/triage",
    response_model=TriageResponse,
    status_code=status.HTTP_200_OK,
    summary="Triage emergency distress transcript (Frontend compatibility alias)"
)
async def triage_emergency_alias(request: TriageRequest):
    return await _process_triage(request)
