from fastapi import APIRouter, HTTPException, status
from app.models.schemas import TriageRequest, TriageResponse, HospitalInfo
from app.services.bhashini_service import bhashini_service
from app.agent.triage_agent import emergency_agent

router = APIRouter(prefix="/api/v1/agent", tags=["Agent Triage"])

@router.post(
    "/triage",
    response_model=TriageResponse,
    status_code=status.HTTP_200_OK,
    summary="Triage emergency distress transcript"
)
async def triage_emergency(request: TriageRequest):
    """
    Takes transcribed emergency text (Hindi/Hinglish/English),
    translates it via Bhashini, runs the Antigravity EmergencyTriageAgent,
    fetches 24/7 specialized hospitals, and generates an SBAR handover.
    """
    if not request.transcribed_text or not request.transcribed_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcribed emergency text cannot be empty."
        )

    try:
        # Step 1: Translate via Bhashini (with fallback)
        translated = await bhashini_service.translate_to_english(request.transcribed_text)

        # Step 2: Invoke Antigravity EmergencyTriageAgent with tool execution
        result = await emergency_agent.evaluate_and_triage(translated)

        # Step 3: Format output response
        return TriageResponse(
            original_text=request.transcribed_text,
            translated_text=translated,
            urgency_level=result["urgency_level"],
            specialty=result["specialty"],
            hospitals=[HospitalInfo(**h) for h in result["hospitals"]],
            sbar_handover=result["sbar_handover"],
            is_fallback_data=result["is_fallback_data"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Emergency triage processing error: {str(e)}"
        )
