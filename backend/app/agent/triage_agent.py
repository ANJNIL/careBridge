import logging
import json
import re
from typing import Dict, Any
from app.agent.tools import fetch_nearby_hospitals, generate_sbar_handover

logger = logging.getLogger(__name__)

TRIAGE_SYSTEM_PROMPT = """
You are the CareBridge Emergency Triage Agent, an expert emergency navigation AI.

CRITICAL SAFETY & OPERATIONAL MANDATES:
1. STRICTLY NON-DIAGNOSTIC: You must NEVER diagnose any disease, illness, or medical pathology (e.g., never say "patient has myocardial infarction", "patient has appendicitis").
2. YOUR ONLY ROLE: 
   - Assess URGENCY LEVEL: Must strictly be one of: ["Critical", "Moderate", "Minor"].
     * Critical: Severe chest pain, unconsciousness, severe hemorrhage, respiratory arrest, severe burns.
     * Moderate: Controlled fractures, deep cuts without arterial bleed, high fever, abdominal pain.
     * Minor: Superficial abrasions, mild sprains, minor headaches.
   - Determine REQUIRED SPECIALTY: E.g., "Cardiac", "Trauma", "Burn", "Neurological", "Pediatric", or "General".
3. Return your final evaluation as valid JSON with keys:
   {
     "urgency_level": "Critical" | "Moderate" | "Minor",
     "specialty": "Cardiac" | "Trauma" | "Burn" | "General" | "Neurological",
     "primary_symptom_summary": "Concise summary of presenting distress without diagnostic claims"
   }
"""

class EmergencyTriageAgent:
    def __init__(self):
        self.agent_initialized = False
        self._init_antigravity()

    def _init_antigravity(self):
        """Initializes the Google Antigravity Agent if available."""
        try:
            from google.antigravity import LocalAgentConfig, CapabilitiesConfig
            self.config = LocalAgentConfig(
                system_instructions=TRIAGE_SYSTEM_PROMPT,
                capabilities=CapabilitiesConfig()
            )
            self.agent_initialized = True
            logger.info("Google Antigravity EmergencyTriageAgent initialized.")
        except Exception as e:
            logger.warning(f"Google Antigravity SDK running in resilient standalone mode: {e}")
            self.agent_initialized = False

    async def evaluate_and_triage(self, translated_text: str) -> Dict[str, Any]:
        """
        Executes triage assessment:
        1. Evaluates urgency & specialty (Strictly Non-diagnostic).
        2. Calls fetch_nearby_hospitals tool.
        3. Calls generate_sbar_handover tool.
        """
        urgency = "Moderate"
        specialty = "General"
        symptom_summary = translated_text

        # 1. Antigravity Agent Evaluation (or resilient deterministic parser)
        evaluated = False
        if self.agent_initialized:
            try:
                from google.antigravity import Agent
                async with Agent(self.config) as agent:
                    prompt = f"Assess the following patient emergency transcript and return the required JSON:\n\n{translated_text}"
                    response = await agent.chat(prompt)
                    
                    full_text = ""
                    async for token in response:
                        full_text += token

                    json_match = re.search(r"\{.*?\}", full_text, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group(0))
                        urgency = parsed.get("urgency_level", "Moderate")
                        specialty = parsed.get("specialty", "General")
                        symptom_summary = parsed.get("primary_symptom_summary", translated_text)
                        evaluated = True
            except Exception as agent_err:
                logger.warning(f"Antigravity runtime chat error: {agent_err}. Falling back to rule-based triage.")

        if not evaluated:
            # Deterministic, non-diagnostic rule-engine fallback
            text_lower = translated_text.lower()
            if any(k in text_lower for k in ["chest", "heart", "cardiac", "angina", "seene", "chhati", "chhaati", "respiratory", "breath"]):
                urgency = "Critical"
                specialty = "Cardiac"
            elif any(k in text_lower for k in ["burn", "fire", "aag", "scald", "acid"]):
                urgency = "Critical" if "severe" in text_lower else "Moderate"
                specialty = "Burn"
            elif any(k in text_lower for k in ["accident", "bleed", "fracture", "trauma", "cut", "wound", "head injury", "unconscious", "unresponsive", "consciousness", "behosh"]):
                urgency = "Critical" if any(k in text_lower for k in ["severe", "blood", "head", "unconscious", "unresponsive", "consciousness", "open"]) else "Moderate"
                specialty = "Trauma"
            elif any(k in text_lower for k in ["mild", "scratch", "sprain", "twisted"]):
                urgency = "Minor"
                specialty = "General"

        # 2. Automatically invoke Agent Skills (fetch_nearby_hospitals & generate_sbar_handover)
        hospitals, is_fallback = await fetch_nearby_hospitals(specialty)
        sbar = generate_sbar_handover(
            symptoms=symptom_summary,
            specialty=specialty,
            urgency=urgency
        )

        return {
            "urgency_level": urgency,
            "specialty": specialty,
            "hospitals": hospitals,
            "sbar_handover": sbar,
            "is_fallback_data": is_fallback
        }

emergency_agent = EmergencyTriageAgent()
