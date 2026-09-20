import { Hospital, SupportedLanguage, AuthUser, DistressTriageResult } from '../../types';

export type CareBridgeScreen =
  | 'home'
  | 'tell_problem'
  | 'analyzing'
  | 'emergency_detected'
  | 'facilities'
  | 'hospital_details'
  | 'route'
  | 'cost_breakdown'
  | 'emergency_handoff'
  | 'offline_mode'
  | 'share_family';

export interface CareBridgeState {
  currentScreen: CareBridgeScreen;
  previousScreen?: CareBridgeScreen;
  selectedLanguage: SupportedLanguage;
  problemText: string;
  detectedInfo: {
    patient: string;
    symptoms: string[];
    urgency: 'High' | 'Moderate' | 'Low';
    language: string;
    location: string;
  };
  selectedHospital: Hospital;
  isOffline: boolean;
  triageResult?: DistressTriageResult | null;
}
