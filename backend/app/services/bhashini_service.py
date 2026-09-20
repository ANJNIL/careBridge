import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Emergency lexicon pattern mapping for offline demo safety
import re

EMERGENCY_PATTERNS = [
    (r"(seene|c[h]+[a]+ti|chest|dil|heart).*(dard|pain|heavy|pressure|attack)", "acute chest pain and cardiac distress"),
    (r"(s[a]+n?s|breath).*(dikkat|takleef|phool|problem|shortness|gasp|ruk)", "acute respiratory distress and difficulty breathing"),
    (r"(behosh|unconscious|unresponsive|faint|chakkargir)", "unresponsive and loss of consciousness"),
    (r"(khoon|blood|bleeding).*(beh|nikal|flow|loss)", "severe bleeding and hemorrhage"),
    (r"(aag|jal|burn|fire|acid)", "severe burn injuries"),
    (r"(accident|takkar|crash|fracture|toot|fall)", "high-impact traumatic accident with structural injury"),
    (r"(sir|head).*(chot|injury|dard|bleed)", "head trauma and injury")
]

class BhashiniService:
    async def translate_to_english(self, text: str) -> str:
        """
        Translates Hindi/Hinglish to English using Bhashini API,
        with an emergency translation fallback.
        """
        text_clean = text.strip()
        if not text_clean:
            return ""

        # Attempt live Bhashini API if configured
        if settings.BHASHINI_API_KEY and settings.BHASHINI_USER_ID:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    payload = {
                        "pipelineTasks": [
                            {
                                "taskType": "translation",
                                "config": {
                                    "language": {
                                        "sourceLanguage": "hi",
                                        "targetLanguage": "en"
                                    }
                                }
                            }
                        ],
                        "inputData": {
                            "input": [{"source": text_clean}]
                        }
                    }
                    headers = {
                        "Authorization": settings.BHASHINI_API_KEY,
                        "userID": settings.BHASHINI_USER_ID,
                        "ulcaApiKey": settings.BHASHINI_API_KEY
                    }
                    response = await client.post(settings.BHASHINI_ENDPOINT, json=payload, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        translated = data["pipelineResponse"][0]["output"][0]["target"]
                        return translated
            except Exception as err:
                logger.warning(f"Bhashini live translation failed: {err}. Using local interpreter.")

        # Fallback: Check if already predominantly English or translate known Hinglish tokens
        lower_text = text_clean.lower()
        translated_tokens = []
        matched_any = False
        for pattern, eng_equivalent in EMERGENCY_PATTERNS:
            if re.search(pattern, lower_text):
                translated_tokens.append(eng_equivalent)
                matched_any = True

        if matched_any:
            return f"Patient report (translated): {', '.join(translated_tokens)}. Original context: '{text_clean}'"

        return text_clean

bhashini_service = BhashiniService()
