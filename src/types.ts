export type SupportedLanguage = 'hi' | 'en' | 'ta' | 'te' | 'mr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  voicePromptExample: string;
  placeholderText: string;
}

export type TriageLevel = 1 | 2 | 3;

export interface SBARCard {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

export interface DistressTriageResult {
  detectedLanguage: string;
  originalText: string;
  englishTranslation: string;
  keySignals: string[];
  triageLevel: TriageLevel;
  triageCategory: 'Immediate / Critical' | 'Urgent' | 'Non-Urgent';
  urgencyReasoning: string;
  requiredSpecialties: string[];
  immediateFirstAidGuidance: string[];
  safetyDisclaimer: string;
  sbar: SBARCard;
  suggestedFacilityType: string;
  criticalGoldenHourAlert?: boolean;
}

export interface PatientSpecialNeed {
  id: string;
  label: string;
  iconName: string;
  description: string;
}

export interface AIHospitalRecommendation {
  hospitalId: string;
  hospitalName: string;
  fitScore: number; // e.g. 98
  fitTier: 'Best Match' | 'Strong Alternative' | 'Secondary Option';
  aiRationale: string;
  keyAdvantages: string[];
  potentialLimitations?: string[];
  urgencyReadiness: string;
}

export interface AIProblemAnalysisResult {
  analysisSummary: string;
  urgencyLevel: TriageLevel;
  urgencyLabel: string;
  chiefComplaints: string[];
  recommendedSpecialties: string[];
  clinicalConsiderations: string[];
  estimatedTimeWindow: string;
  firstAidSteps: string[];
  matchedHospitalRecommendations: AIHospitalRecommendation[];
  sbar: SBARCard;
  safetyDisclaimer: string;
}

export interface CostItem {
  service: string;
  costRange: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  etaMinutes: number;
  lat: number;
  lng: number;
  type: 'Govt Super-Specialty' | 'Private Multi-Specialty' | 'Trauma & Emergency Center' | 'Community Hospital';
  verified: boolean;
  contactNumber: string;
  emergencyDeskDirect: string;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  oxygenBedsTotal: number;
  oxygenBedsAvailable: number;
  generalBedsAvailable: number;
  ventilatorsAvailable: number;
  capabilities: string[];
  traumaLevel: 1 | 2 | 3;
  matchesDistress?: boolean;
  matchScore?: number;
  matchReasons?: string[];
  lastUpdatedMinutesAgo: number;
  image?: string;
  isOpen24x7?: boolean;
  estimatedCostRange?: string;
  estimatedCostBreakdown?: CostItem[];
  whyFeatures?: string[];
  specialtiesTags?: string[];
}

export interface BloodBank {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  contact: string;
  address: string;
  stock: Record<string, number>;
}

export interface Pharmacy {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  contact: string;
  address: string;
  open24x7: boolean;
  deliveryAvailable: boolean;
  essentialMedicines: string[];
}

export interface IncomingEmergencyDispatch {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  phone: string;
  triageLevel: TriageLevel;
  sbar: SBARCard;
  symptoms: string[];
  targetHospitalId?: string;
  targetHospitalName?: string;
  hospitalTargetId?: string;
  hospitalName?: string;
  ambulanceDispatched?: boolean;
  ambulanceEtaMinutes: number;
  patientLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  status: 'Pre-Arrival Alert' | 'Triage Pre-Cleared' | 'Bed Reserved' | 'Ambulance En Route' | 'Arrived at ER';
  digitalHandshakeToken: string;
  timestamp: string;
}

export type ActiveAppView = 'carebridge_ui' | 'tactical_hud' | 'patient_mobile' | 'hospital_portal' | 'split_live_loop' | 'pm_spec';

export type UserRole = 'patient' | 'hospital_staff';
export type AuthProvider = 'google' | 'phone';

export type EmergencyRelation = 
  | 'Family'
  | 'Father'
  | 'Mother'
  | 'Spouse'
  | 'Child'
  | 'Doctor'
  | 'Ambulance'
  | 'Police'
  | 'Caregiver'
  | 'Neighbor'
  | 'Other';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: EmergencyRelation;
  isPrimary: boolean;
  notes?: string;
  notifySms?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  provider: AuthProvider;
  token?: string;
  verified: boolean;
  // Patient specific
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContacts?: EmergencyContact[];
  allergies?: string[];
  medicalConditions?: string[];
  // Hospital specific
  hospitalId?: string;
  hospitalName?: string;
  staffDesignation?: string;
  badgeId?: string;
  department?: string;
}
