import logging
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

# Resilient fallback data so hackathon live demos NEVER crash if database is unreachable or keys are empty
FALLBACK_HOSPITALS: Dict[str, List[Dict[str, Any]]] = {
    "Cardiac": [
        {
            "id": "hosp-cardiac-01",
            "name": "Apollo Emergency & Heart Institute",
            "address": "Ring Road, Sector 12",
            "contact_number": "+91-11-26925858",
            "is_24_7_open": True,
            "specialties": ["Cardiac", "Emergency", "ICU"],
            "distance_km": 1.8
        },
        {
            "id": "hosp-cardiac-02",
            "name": "Fortis Escorts Heart Emergency Center",
            "address": "Okhla Road, New Delhi",
            "contact_number": "+91-11-47135000",
            "is_24_7_open": True,
            "specialties": ["Cardiac", "Interventional", "Emergency"],
            "distance_km": 3.4
        }
    ],
    "Trauma": [
        {
            "id": "hosp-trauma-01",
            "name": "Apex Level-1 Trauma Care Center",
            "address": "National Highway Junction, Hub 4",
            "contact_number": "+91-11-26593677",
            "is_24_7_open": True,
            "specialties": ["Trauma", "Surgical", "Emergency"],
            "distance_km": 2.1
        },
        {
            "id": "hosp-trauma-02",
            "name": "Metro Central Emergency & Ortho Hospital",
            "address": "Civil Lines, Block B",
            "contact_number": "+91-11-23966000",
            "is_24_7_open": True,
            "specialties": ["Trauma", "General", "Emergency"],
            "distance_km": 4.0
        }
    ],
    "Burn": [
        {
            "id": "hosp-burn-01",
            "name": "Safdarjung National Burn & Plastic Surgery Care",
            "address": "Ring Road, Opposite AIIMS",
            "contact_number": "+91-11-26165060",
            "is_24_7_open": True,
            "specialties": ["Burn", "Plastic Surgery", "ICU"],
            "distance_km": 3.1
        }
    ],
    "General": [
        {
            "id": "hosp-gen-01",
            "name": "City Lifeline 24/7 Multi-Specialty Hospital",
            "address": "Central Avenue, Sector 5",
            "contact_number": "+91-11-22446688",
            "is_24_7_open": True,
            "specialties": ["General", "Pediatric", "Emergency"],
            "distance_km": 1.5
        }
    ]
}

class SupabaseService:
    def __init__(self):
        self.client = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY and "supabase.co" in settings.SUPABASE_URL:
            try:
                from supabase import create_client
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("Supabase client successfully connected.")
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}. Fallback mode active.")
                self.client = None

    async def get_nearby_24_7_hospitals(self, specialty: str, limit: int = 3) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Queries Supabase 'hospitals' table where is_24_7_open is true and matches specialty.
        Falls back seamlessly to mock data on error or empty results.
        """
        is_fallback = False
        if self.client:
            try:
                # Query Supabase: is_24_7_open is True, contains specialty, limit
                response = (
                    self.client.table("hospitals")
                    .select("*")
                    .eq("is_24_7_open", True)
                    .contains("specialties", [specialty])
                    .limit(limit)
                    .execute()
                )
                if response.data and len(response.data) > 0:
                    return response.data, False
                logger.info(f"No specific '{specialty}' hospitals found in Supabase. Using fallback dataset.")
            except Exception as e:
                logger.error(f"Supabase query failed: {e}. Using fallback data.")

        # Fallback handling
        is_fallback = True
        matched = FALLBACK_HOSPITALS.get(specialty) or FALLBACK_HOSPITALS.get("General", [])
        return matched[:limit], is_fallback

supabase_service = SupabaseService()
