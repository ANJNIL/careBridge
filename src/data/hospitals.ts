import { Hospital, BloodBank, Pharmacy, IncomingEmergencyDispatch } from '../types';

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Choithram Hospital & Research Centre',
    address: 'Near M.G. Road, Indore, Madhya Pradesh',
    distanceKm: 2.3,
    etaMinutes: 8,
    lat: 22.7196,
    lng: 75.8577,
    type: 'Trauma & Emergency Center',
    verified: true,
    isOpen24x7: true,
    contactNumber: '+91 731 475 1000',
    emergencyDeskDirect: '+91 731 475 1999',
    icuBedsTotal: 40,
    icuBedsAvailable: 8,
    oxygenBedsTotal: 80,
    oxygenBedsAvailable: 18,
    generalBedsAvailable: 35,
    ventilatorsAvailable: 6,
    capabilities: [
      '24/7 ER',
      'Cath Lab (Interventional Cardiology)',
      'Trauma OT Level-1',
      'Stroke Code Team',
      'Blood Bank Onsite',
      'Pediatric ICU',
      'Oxygen Support Available'
    ],
    specialtiesTags: ['Emergency', 'ICU', 'Oxygen', 'Cardiology'],
    traumaLevel: 1,
    lastUpdatedMinutesAgo: 2,
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
    estimatedCostRange: '₹ 5,000 - ₹ 12,000',
    estimatedCostBreakdown: [
      { service: 'Emergency Consultation', costRange: '₹ 1,000 - 2,000' },
      { service: 'Initial Tests (ECG, X-Ray etc.)', costRange: '₹ 2,000 - 5,000' },
      { service: 'General Ward (if needed)', costRange: '₹ 2,000 - 5,000' },
      { service: 'ICU (if required)', costRange: '₹ 10,000 - 25,000' },
    ],
    whyFeatures: [
      '24x7 Emergency Department',
      'ICU & Oxygen Support Available',
      'Cardiology Specialist On Call',
      'Closest suitable facility based on your needs'
    ]
  },
  {
    id: 'hosp-2',
    name: 'Bombay Hospital',
    address: 'Eastern Ring Road, IDA Scheme 94, Indore, Madhya Pradesh',
    distanceKm: 3.6,
    etaMinutes: 11,
    lat: 22.7485,
    lng: 75.8942,
    type: 'Private Multi-Specialty',
    verified: true,
    isOpen24x7: true,
    contactNumber: '+91 731 257 5555',
    emergencyDeskDirect: '+91 731 257 5911',
    icuBedsTotal: 50,
    icuBedsAvailable: 12,
    oxygenBedsTotal: 100,
    oxygenBedsAvailable: 25,
    generalBedsAvailable: 60,
    ventilatorsAvailable: 9,
    capabilities: [
      '24/7 ER',
      'Cath Lab',
      'Neuro-Trauma Unit',
      'ICU & Oxygen Support',
      'Blood Bank'
    ],
    specialtiesTags: ['Emergency', 'ICU', 'Oxygen'],
    traumaLevel: 1,
    lastUpdatedMinutesAgo: 3,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    estimatedCostRange: '₹ 6,000 - ₹ 14,000',
    estimatedCostBreakdown: [
      { service: 'Emergency Consultation', costRange: '₹ 1,200 - 2,200' },
      { service: 'Initial Tests & Diagnostics', costRange: '₹ 2,500 - 5,500' },
      { service: 'General Ward', costRange: '₹ 2,500 - 5,500' },
      { service: 'ICU (if required)', costRange: '₹ 12,000 - 28,000' },
    ],
    whyFeatures: [
      '24x7 Emergency Department',
      'Advanced Multi-slice CT & MRI',
      'ICU Beds Available Immediately',
      'Comprehensive Cardiac & Neuro Care'
    ]
  },
  {
    id: 'hosp-3',
    name: 'Ruby Hall Clinic',
    address: 'A.B. Road, Near Geeta Bhawan, Indore, Madhya Pradesh',
    distanceKm: 4.8,
    etaMinutes: 14,
    lat: 22.7230,
    lng: 75.8780,
    type: 'Private Multi-Specialty',
    verified: true,
    isOpen24x7: true,
    contactNumber: '+91 731 249 9000',
    emergencyDeskDirect: '+91 731 249 9999',
    icuBedsTotal: 30,
    icuBedsAvailable: 5,
    oxygenBedsTotal: 60,
    oxygenBedsAvailable: 14,
    generalBedsAvailable: 28,
    ventilatorsAvailable: 4,
    capabilities: [
      '24/7 ER',
      'Trauma Stabilization',
      'Oxygen Beds',
      'Cardiology Specialist',
      'Pediatric Care'
    ],
    specialtiesTags: ['Emergency', 'ICU', 'Oxygen'],
    traumaLevel: 2,
    lastUpdatedMinutesAgo: 5,
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
    estimatedCostRange: '₹ 4,500 - ₹ 11,000',
    estimatedCostBreakdown: [
      { service: 'Emergency Consultation', costRange: '₹ 900 - 1,800' },
      { service: 'Initial Emergency Tests', costRange: '₹ 1,800 - 4,500' },
      { service: 'Ward Bed', costRange: '₹ 1,800 - 4,000' },
      { service: 'ICU Support', costRange: '₹ 9,000 - 22,000' },
    ],
    whyFeatures: [
      'Rapid Triage Assessment Protocol',
      'Full Emergency & Suture Wing',
      'In-House Diagnostic Pathology',
      'Active Blood Bank & Pharmacy'
    ]
  },
  {
    id: 'hosp-4',
    name: 'Jupiter Hospital',
    address: 'Bypass Expressway, Near Nipania, Indore, Madhya Pradesh',
    distanceKm: 6.1,
    etaMinutes: 18,
    lat: 22.7610,
    lng: 75.9120,
    type: 'Private Multi-Specialty',
    verified: true,
    isOpen24x7: true,
    contactNumber: '+91 731 422 7777',
    emergencyDeskDirect: '+91 731 422 7911',
    icuBedsTotal: 45,
    icuBedsAvailable: 9,
    oxygenBedsTotal: 90,
    oxygenBedsAvailable: 20,
    generalBedsAvailable: 45,
    ventilatorsAvailable: 7,
    capabilities: [
      '24/7 ER',
      'Multi-Organ Trauma Center',
      'Level-1 Resuscitation Bays',
      'High-Flow Oxygen & Ventilators',
      'Critical Ambulance Fleet'
    ],
    specialtiesTags: ['Emergency', 'ICU', 'Oxygen'],
    traumaLevel: 1,
    lastUpdatedMinutesAgo: 6,
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&auto=format&fit=crop&q=80',
    estimatedCostRange: '₹ 7,000 - ₹ 16,000',
    estimatedCostBreakdown: [
      { service: 'Emergency Consultation', costRange: '₹ 1,500 - 2,500' },
      { service: 'Trauma Workup & Scans', costRange: '₹ 3,000 - 6,500' },
      { service: 'High-Dependency Bed', costRange: '₹ 3,000 - 6,000' },
      { service: 'Intensive Care Unit (ICU)', costRange: '₹ 14,000 - 30,000' },
    ],
    whyFeatures: [
      'Level-1 Multi-Specialty Trauma Care',
      'Dedicated Resuscitation Bay',
      'Critical Care Team 24x7 Onsite',
      'State-of-the-Art Cath & Surgical Theatres'
    ]
  },
  {
    id: 'hosp-5',
    name: 'GreenLife Community Health Center',
    address: 'Railway Station Road, Suburban Block B',
    distanceKm: 2.1,
    etaMinutes: 6,
    lat: 19.0710,
    lng: 72.8710,
    type: 'Community Hospital',
    verified: true,
    contactNumber: '+91 22 2511 2020',
    emergencyDeskDirect: '+91 22 2511 2029',
    icuBedsTotal: 6,
    icuBedsAvailable: 0, // Zero ICU - will be flagged for Level 1 critical triage
    oxygenBedsTotal: 15,
    oxygenBedsAvailable: 3,
    generalBedsAvailable: 12,
    ventilatorsAvailable: 0,
    capabilities: [
      'Day/Night Urgent Care',
      'Minor Wound Suture',
      'Nebulization & O2 Stabilization',
      'First Aid & Splints',
      'Ambulance Transfer Depot'
    ],
    traumaLevel: 3,
    lastUpdatedMinutesAgo: 10,
  }
];

export const INITIAL_BLOOD_BANKS: BloodBank[] = [
  {
    id: 'bb-1',
    name: 'Apex Rotary Central Blood Bank & Component Lab',
    distanceKm: 3.4,
    etaMinutes: 9,
    contact: '+91 22 2415 5544',
    address: 'Adjacent to Metro Apex Hospital, Sector 8',
    stock: {
      'O-': 4, // Crucial universal donor
      'O+': 24,
      'A+': 18,
      'A-': 3,
      'B+': 32,
      'B-': 5,
      'AB+': 12,
      'AB-': 2,
    }
  },
  {
    id: 'bb-2',
    name: 'Red Cross Society Regional Blood Center',
    distanceKm: 4.9,
    etaMinutes: 13,
    contact: '+91 22 2266 1122',
    address: '14 Shahid Bhagat Singh Marg',
    stock: {
      'O-': 2,
      'O+': 19,
      'A+': 14,
      'A-': 1,
      'B+': 26,
      'B-': 3,
      'AB+': 9,
      'AB-': 1,
    }
  },
  {
    id: 'bb-3',
    name: 'State Transfusion Medicine Blood Registry',
    distanceKm: 6.2,
    etaMinutes: 15,
    contact: '+91 22 2404 9090',
    address: 'Civil Hospital Campus, Wing C',
    stock: {
      'O-': 7,
      'O+': 38,
      'A+': 27,
      'A-': 6,
      'B+': 41,
      'B-': 8,
      'AB+': 16,
      'AB-': 4,
    }
  }
];

export const INITIAL_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharm-1',
    name: 'Apollo 24x7 Emergency Pharmacy & Surgical',
    distanceKm: 1.8,
    etaMinutes: 5,
    contact: '+91 22 2640 1234',
    address: 'Shop 4, Junction Plaza, Link Road',
    open24x7: true,
    deliveryAvailable: true,
    essentialMedicines: ['Sorbitrate / Nitroglycerin Sublingual', 'Aspirin 300mg / Clopidogrel', 'Asthma Inhalers (Salbutamol/Budesonide)', 'EpiPen / Adrenaline', 'Burn Creams & Sterile Gauze', 'ORS & IV Infusions']
  },
  {
    id: 'pharm-2',
    name: 'MedPlus 24-Hour Critical Drug Store',
    distanceKm: 2.9,
    etaMinutes: 7,
    contact: '+91 22 2577 8899',
    address: 'Near Central Railway Gate, East',
    open24x7: true,
    deliveryAvailable: true,
    essentialMedicines: ['Emergency Insulin', 'Anti-Rabies Vaccines', 'Tetanus Toxoid', 'Hemostatic Gauze', 'Blood Pressure Emergency Meds']
  },
  {
    id: 'pharm-3',
    name: 'Sanjeevani Day & Night Chemists',
    distanceKm: 3.5,
    etaMinutes: 10,
    contact: '+91 22 2622 4545',
    address: 'Opposite Civil Hospital Gate 2',
    open24x7: true,
    deliveryAvailable: false,
    essentialMedicines: ['Full Surgical Trauma Kits', 'Oxygen Canisters (Portable)', 'Colloids & Crystalloids', 'Emergency Antibiotics']
  }
];

export const LANGUAGE_OPTIONS = [
  {
    code: 'hi' as const,
    label: 'Hindi / Hinglish',
    nativeLabel: 'हिंदी / Hinglish',
    voicePromptExample: 'Mere father ko chest pain hai and saans lene mein dikkat hai.',
    placeholderText: 'मरीज़ की स्थिति बोलें या लिखें (e.g. Mere father ko chest pain hai...)',
  },
  {
    code: 'en' as const,
    label: 'English',
    nativeLabel: 'English',
    voicePromptExample: 'Severe chest pain radiating to left arm with extreme sweating and dizziness.',
    placeholderText: 'Speak or describe the emergency (e.g. Unconscious after bike accident, heavy bleeding...)',
  },
  {
    code: 'ta' as const,
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    voicePromptExample: 'என் தந்தைக்கு கடுமையான மார்பு வலி மற்றும் மூச்சு திணறல் உள்ளது.',
    placeholderText: 'மருத்துவ அவசரநிலையை பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள்...',
  },
  {
    code: 'te' as const,
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    voicePromptExample: 'మా నాన్నగారికి గుండెలో తీవ్రమైన నొప్పి మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంది.',
    placeholderText: 'అత్యవసర పరిస్థితిని మాట్లాడండి లేదా టైప్ చేయండి...',
  },
  {
    code: 'mr' as const,
    label: 'Marathi',
    nativeLabel: 'मराठी',
    voicePromptExample: 'माझ्या वडिलांना छातीत खूप दुखत आहे आणि श्वास घ्यायला त्रास होत आहे.',
    placeholderText: 'वैद्यकीय आणीबाणी बोला किंवा लिहा...',
  },
];

export const INITIAL_DISPATCHES: IncomingEmergencyDispatch[] = [
  {
    id: 'disp-001',
    patientName: 'Rajesh Sharma',
    patientAge: 58,
    patientGender: 'M',
    triageLevel: 1,
    symptoms: ['Severe retrosternal chest pain', 'Diaphoresis (profuse sweating)', 'Acute dyspnea'],
    sbar: {
      situation: '58yo male experiencing crushing substernal chest pressure radiating to left jaw for 35 mins.',
      background: 'Known hypertensive on Telmisartan. No prior PCI/stent history.',
      assessment: 'High suspicion for Acute Coronary Syndrome (STEMI equivalence). Immediate Cath Lab activation needed.',
      recommendation: 'Pre-clear Trauma resuscitation Bay 1. Prep 12-lead ECG, Aspirin 325mg chewable, ready Heparin protocol.'
    },
    hospitalTargetId: 'hosp-1',
    hospitalName: 'Metro Apex Multi-Specialty & Trauma Center',
    ambulanceEtaMinutes: 7,
    status: 'Pre-Arrival Alert',
    digitalHandshakeToken: 'CB-9821-T1',
    phone: '+91 98201 44102',
    timestamp: '10:42 AM'
  },
  {
    id: 'disp-002',
    patientName: 'Kavita Sundaram',
    patientAge: 32,
    patientGender: 'F',
    triageLevel: 2,
    symptoms: ['Open compound tibia fracture', 'Active moderate bleeding', 'Severe limb deformity'],
    sbar: {
      situation: '32yo female passenger in two-wheeler collision with road barrier.',
      background: 'No known drug allergies. Tetanus shot status unknown.',
      assessment: 'Grade II open lower leg fracture with moderate hemorrhage controlled by pressure dressing.',
      recommendation: 'Prepare orthopedic trauma bay, urgent X-ray, IV Ceftriaxone, and analgesia.'
    },
    hospitalTargetId: 'hosp-1',
    hospitalName: 'Metro Apex Multi-Specialty & Trauma Center',
    ambulanceEtaMinutes: 14,
    status: 'Triage Pre-Cleared',
    digitalHandshakeToken: 'CB-4512-T2',
    phone: '+91 97693 88190',
    timestamp: '10:35 AM'
  },
  {
    id: 'disp-003',
    patientName: 'Master Aarav Patil',
    patientAge: 6,
    patientGender: 'M',
    triageLevel: 1,
    symptoms: ['Acute stridor / wheezing', 'Perioral cyanosis (blue lips)', 'Severe intercostal retractions'],
    sbar: {
      situation: '6yo male presenting with severe status asthmaticus refractory to home inhaler.',
      background: 'Known childhood asthma.',
      assessment: 'Impending respiratory fatigue with oxygen desaturation.',
      recommendation: 'Pediatric high-flow oxygen, continuous nebulized Salbutamol/Ipratropium, prepare PICU bed.'
    },
    hospitalTargetId: 'hosp-4',
    hospitalName: 'Sanjeevani Mother & Child Emergency Hospital',
    ambulanceEtaMinutes: 11,
    status: 'Bed Reserved',
    digitalHandshakeToken: 'CB-7731-T1',
    phone: '+91 98211 90900',
    timestamp: '10:28 AM'
  }
];

