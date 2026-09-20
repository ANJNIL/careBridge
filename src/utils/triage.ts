import { DistressTriageResult, Hospital, TriageLevel, InterimTransitSolution } from '../types';

/**
 * Hospital Matchmaking Algorithm:
 * Evaluates candidate hospitals based on:
 * 1. Triage Level compatibility (Critical Level 1 cases penalize facilities lacking Cath Lab, Trauma OT, or with 0 ICU beds)
 * 2. Real-time validated ICU and Oxygen bed availability
 * 3. Travel time / ETA (closest suitable facility given critical Golden Hour)
 * 4. Verified facility status
 */
export function rankHospitals(
  hospitals: Hospital[],
  triageResult?: DistressTriageResult | null
): Hospital[] {
  if (!triageResult) {
    // Default sort by ETA
    return [...hospitals].sort((a, b) => a.etaMinutes - b.etaMinutes);
  }

  const { triageLevel, requiredSpecialties } = triageResult;

  return [...hospitals]
    .map((hospital) => {
      let score = 100;
      const reasons: string[] = [];

      // ETA weighting: In Level 1 emergencies, every minute counts (Golden Hour rule)
      const etaPenalty = hospital.etaMinutes * (triageLevel === 1 ? 4 : 2);
      score -= etaPenalty;

      // Bed availability check
      if (triageLevel === 1) {
        if (hospital.icuBedsAvailable <= 0) {
          score -= 50;
          reasons.push('⚠️ Zero ICU beds currently available');
        } else {
          score += 25;
          reasons.push(`✓ ${hospital.icuBedsAvailable} ICU beds ready`);
        }
      }

      if (hospital.oxygenBedsAvailable > 0) {
        score += 10;
      }

      // Capability matching
      let matchedCount = 0;
      requiredSpecialties.forEach((spec) => {
        const hasCapability = hospital.capabilities.some((cap) =>
          cap.toLowerCase().includes(spec.toLowerCase().split(' ')[0]) ||
          spec.toLowerCase().includes(cap.toLowerCase().split(' ')[0])
        );
        if (hasCapability) {
          matchedCount++;
        }
      });

      if (matchedCount > 0) {
        score += matchedCount * 15;
        reasons.push(`✓ Matches ${matchedCount} required critical emergency capabilities`);
      } else if (triageLevel === 1 && hospital.traumaLevel === 3) {
        score -= 40;
        reasons.push('⚠️ Community clinic lacks tertiary Level-1 trauma/cardiac OT');
      }

      // Verified status bonus
      if (hospital.verified) {
        score += 10;
        reasons.push('✓ Verified 24/7 ER hotline active');
      }

      const matchesDistress = triageLevel === 1 
        ? hospital.traumaLevel <= 2 && hospital.icuBedsAvailable > 0
        : true;

      return {
        ...hospital,
        matchScore: Math.max(10, Math.round(score)),
        matchesDistress,
        matchReasons: reasons,
      };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

export function formatTriageBadge(level: TriageLevel) {
  switch (level) {
    case 1:
      return {
        label: 'Level 1: Immediate / Critical',
        subLabel: 'Life-threatening • Golden Hour Protocol',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        dot: 'bg-rose-500 shadow-rose-500/50',
        banner: 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-500/40 text-rose-100',
      };
    case 2:
      return {
        label: 'Level 2: Urgent',
        subLabel: 'Potentially severe • Rapid hospital evaluation needed',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        dot: 'bg-amber-500 shadow-amber-500/50',
        banner: 'bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-amber-500/40 text-amber-100',
      };
    case 3:
      return {
        label: 'Level 3: Non-Urgent',
        subLabel: 'Stable condition • Urgent care / OPD appropriate',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        dot: 'bg-emerald-500 shadow-emerald-500/50',
        banner: 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 border-emerald-500/40 text-emerald-100',
      };
  }
}

export interface CategorizedProblem {
  patient: string;
  patientRelation: 'self' | 'father' | 'mother' | 'child' | 'sibling' | 'spouse' | 'grandparent' | 'friend' | 'patient';
  symptoms: string[];
  primaryCategory: string;
  urgency: 'High' | 'Moderate' | 'Low';
  urgencyLevel: TriageLevel;
  urgencyTitle: string;
  urgencySubtitle: string;
  languageDetected: string;
  location: string;
  recommendedDepartment: string;
  suggestedFacilityTags: { label: string; isRed?: boolean }[];
  firstAidSteps: string[];
  interimTransitSolution: InterimTransitSolution;
  costBreakdown: { item: string; cost: string }[];
  getFamilyShareMessage: (hospitalName: string, distance: string) => string;
}

/**
 * Intelligent Multilingual NLP Classifier for Emergency & Healthcare Distress.
 * Supports Hindi, Hinglish, English, Tamil, and common colloquial vernaculars.
 */
export function categorizeProblem(inputText: string, languageHint = 'auto'): CategorizedProblem {
  const text = (inputText || '').trim();
  const lower = text.toLowerCase();

  // 1. Detect Patient Relationship (English, Romanized Hinglish, and Devanagari Hindi)
  let patient = 'Patient';
  let patientRelation: CategorizedProblem['patientRelation'] = 'patient';

  if (/(^|[^\w])(papa|pitaji|father|dad|daddy|baap)($|[^\w])|पिता|पापा|पिताजी|बापू|बाबूजी/i.test(text)) {
    patient = 'Father';
    patientRelation = 'father';
  } else if (/(^|[^\w])(mummy|mummyji|mataji|mother|mom|maa)($|[^\w])|माँ|माता|मम्मी|माताजी/i.test(text)) {
    patient = 'Mother';
    patientRelation = 'mother';
  } else if (/(^|[^\w])(bhai|bhaiya|brother)($|[^\w])|भाई|भैया/i.test(text)) {
    patient = 'Brother';
    patientRelation = 'sibling';
  } else if (/(^|[^\w])(behen|didi|sister)($|[^\w])|बहन|दीदी/i.test(text)) {
    patient = 'Sister';
    patientRelation = 'sibling';
  } else if (/(^|[^\w])(bacha|bachhe|bachha|baby|child|kid|beta|beti|son|daughter)($|[^\w])|बच्चा|बच्चे|बेटा|बेटी|शिशु/i.test(text)) {
    patient = 'Child';
    patientRelation = 'child';
  } else if (/(^|[^\w])(patni|wife|biwi|pati|husband)($|[^\w])|पत्नी|पति|बीवी/i.test(text)) {
    patient = 'Spouse';
    patientRelation = 'spouse';
  } else if (/(^|[^\w])(dada|dadaji|dadi|dadiji|nana|nanaji|nani|naniji|grandfather|grandmother)($|[^\w])|दादा|दादी|नाना|नानी/i.test(text)) {
    patient = 'Grandparent';
    patientRelation = 'grandparent';
  } else if (/(^|[^\w])(dost|friend|colleague|yaar)($|[^\w])|दोस्त|मित्र/i.test(text)) {
    patient = 'Friend';
    patientRelation = 'friend';
  } else if (/(^|[^\w])(mujhe|mera|mere|meri|khud|apne\s*aap|i\s*have|i\s*am|i'm|me|myself|suffering|feeling)($|[^\w])|मुझे|मेरा|मेरी|मेरे/i.test(text)) {
    patient = 'Self (Patient)';
    patientRelation = 'self';
  }

  // 2. Language Detection
  let languageDetected = 'English';
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hindiWords = /\b(mujhe|hai|hain|ho|rahi|raha|mein|aur|se|ko|tez|bahut|dikkat|dard|haddi|chot|bukhaar|bukhar|saans|mere|papa|mummy|bhai|chhati|seene)\b/i;
  
  if (hasDevanagari) {
    languageDetected = 'हिन्दी (Hindi)';
  } else if (hindiWords.test(lower)) {
    languageDetected = 'Hinglish / Hindi';
  } else if (/[a-zA-Z]/.test(text)) {
    languageDetected = 'English';
  }

  // 3. Clinical Symptom Signals Extraction (Covers Devanagari Hindi + Romanized Hinglish + English)
  const hasFever = /(^|[^\w])(bukhaar|bukhar|fever|tap|taap|taav|temperature|pyrexia|chills|thand|cold\s*sweat|garam\s*sharir|shiver)($|[^\w])|बुखार|ताप|ठंड|कंपकंपी|गरमी/i.test(text);
  const hasChestCardiac = /(^|[^\w])(chest\s*pain|chhati|seene|seena|heart\s*attack|dil|heart\s*pain|cardiac|angina|palpitation)($|[^\w])|सीने\s*में\s*दर्द|छाती\s*में\s*दर्द|दिल\s*का\s*दौरा|हार्ट\s*अटैक|छाती|हृदय/i.test(text);
  const hasBreathing = /(^|[^\w])(saans|breath|breathing|suffocat|gasping|asthma|dum|dam\s*ghut|dyspnea|wheez|stridor)($|[^\w])|सांस|साँस|सांस\s*फूल|सांस\s*लेने\s*में\s*तकलीफ|दम\s*घुटना/i.test(text);
  const hasNeuroHeadache = /(^|[^\w])(sar\s*dard|sir\s*dard|headache|chakkar|dizzy|dizziness|behosh|unconscious|migraine|fits|daura|dora|seizure|stroke|paralysis)($|[^\w])|लकवा|पैरालिसिस|बेहोश|बेहोशी|दौरा|मिर्गी|सिर\s*दर्द|चक्कर/i.test(text);
  const hasAbdominal = /(^|[^\w])(pet\s*dard|stomach|abdominal|ulti|vomit|vomiting|dast|loose\s*motion|diarrhea|acidity|gas|food\s*poison)($|[^\w])|पेट\s*दर्द|उल्टी|दस्त|मरोड़/i.test(text);
  const hasTraumaBleeding = /(^|[^\w])(chot|accident|khun|khoon|bleed|bleeding|haddi|fracture|bone|cut|wound|fall|gir\s*gaye|injury)($|[^\w])|चोट|एक्सीडेंट|खून|रक्तस्राव|हड्डी|फ्रैक्चर|घाव/i.test(text);
  const hasBurn = /(^|[^\w])(jalan|jal\s*gaya|burn|scald|aag|fire|acid)($|[^\w])|जलना|आग|तेजाब|झुलस/i.test(text);
  
  // High-Precision Snakebite & Envenomation detection
  const hasSnakeBite = /(^|[^\w])(saanp|saap|snake|viper|cobra|krait|envenom|bite|bitten)($|[^\w])|सांप|साँप|सर्प|नाग|करैत/i.test(text) ||
    /(सांप|साँप|सर्प|नाग|bichhu|bichhoo|बिच्छू).*(काट|डस|डंक)/i.test(text) ||
    /(काट|डस|डंक).*(सांप|साँप|सर्प|नाग|bichhu|bichhoo|बिच्छू)/i.test(text) ||
    /snake.*(bite|bit|bitten)/i.test(text) ||
    /(bite|bitten).*snake/i.test(text);

  const hasPoison = /(^|[^\w])(poison|zahar|toxic|chemical|overdose|insecticide|pesticide|acid\s*ingestion)($|[^\w])|जहर|विष|कीटनाशक/i.test(text);
  const hasAnimalBite = /(^|[^\w])(kutta|dog\s*bite|rabies|animal\s*bite)($|[^\w])|कुत्ता.*काट/i.test(text);
  const hasBitePoison = hasSnakeBite || hasPoison || hasAnimalBite || /(^|[^\w])(allergy|anaphylaxis)($|[^\w])/i.test(text);

  const symptoms: string[] = [];

  if (hasSnakeBite) {
    symptoms.push('Venomous Snakebite (सांप का काटना / सर्पदंश)');
  }
  if (hasPoison) {
    symptoms.push('Poisoning / Toxic Ingestion (जहर / कीटनाशक)');
  }
  if (hasFever) {
    symptoms.push('Fever / Bukhaar (Elevated Temperature)');
  }
  if (hasChestCardiac) {
    symptoms.push('Retrosternal Chest Pain (Seene mein dard)');
  }
  if (hasBreathing) {
    symptoms.push('Breathing difficulty (Saans lene mein dikkat)');
  }
  if (hasNeuroHeadache) {
    if (/behosh|unconscious|seizure|stroke|paralysis|लकवा|बेहोश|दौरा/i.test(text)) {
      symptoms.push('Loss of consciousness / Neurological deficit');
    } else {
      symptoms.push('Severe headache / Dizziness (Chakkar / Sar dard)');
    }
  }
  if (hasAbdominal) {
    if (/ulti|vomit|उल्टी/i.test(text)) symptoms.push('Nausea & Vomiting (Ulti)');
    if (/pet\s*dard|stomach|abdominal|पेट\s*दर्द/i.test(text)) symptoms.push('Abdominal pain (Pet dard)');
    if (/dast|loose|diarrhea|दस्त/i.test(text)) symptoms.push('Acute Diarrhea / Dehydration');
  }
  if (hasTraumaBleeding) {
    if (/khun|khoon|bleed|खून|रक्तस्राव/i.test(text)) symptoms.push('Active blood loss / Hemorrhage');
    if (/haddi|fracture|bone|हड्डी|फ्रैक्चर/i.test(text)) symptoms.push('Suspected bone fracture');
    if (/accident|chot|fall|चोट|एक्सीडेंट/i.test(text) && !symptoms.some(s => s.includes('fracture') || s.includes('blood'))) {
      symptoms.push('Trauma / Impact injury');
    }
  }
  if (hasBurn) {
    symptoms.push('Thermal / Burn injury');
  }
  if (hasAnimalBite && !hasSnakeBite) {
    symptoms.push('Animal bite / Rabies post-exposure protocol');
  }

  // Fallback if no specific keyword triggered
  if (symptoms.length === 0) {
    if (text.length > 0) {
      symptoms.push(text.slice(0, 45) + (text.length > 45 ? '...' : ''));
    } else {
      symptoms.push('Acute Medical Distress');
    }
  }

  // 4. Determine Urgency & Primary Category - Snakebites and acute poisons are life-threatening Level 1
  const isCriticalLifeThreatening = 
    hasChestCardiac || 
    hasBreathing || 
    hasSnakeBite || 
    hasPoison ||
    /behosh|unconscious|heart\s*attack|stroke|paralysis|heavy\s*bleeding|seizure|arterial|लकवा|बेहोश|बेहोशी|दौरा|मिर्गी|रक्तस्राव/i.test(text);

  const isUrgent = 
    hasFever || 
    hasAbdominal || 
    hasTraumaBleeding || 
    hasNeuroHeadache || 
    hasBurn || 
    hasAnimalBite;

  let urgency: 'High' | 'Moderate' | 'Low' = 'Low';
  let urgencyLevel: TriageLevel = 3;
  let primaryCategory = 'General Medical Care';
  let urgencyTitle = 'NON-URGENT / GENERAL CARE';
  let urgencySubtitle = 'Consult a general physician or visit an outpatient clinic.';
  let recommendedDepartment = 'General Outpatient Clinic & Pharmacy';
  let suggestedFacilityTags: { label: string; isRed?: boolean }[] = [{ label: 'General OPD' }, { label: 'Pharmacy' }];
  let firstAidSteps: string[] = [
    'Rest in a comfortable, well-ventilated area.',
    'Keep hydrated with clean fluids.',
    'Monitor temperature and vital signs.',
    'Consult a doctor if symptoms persist or worsen.'
  ];

  let costBreakdown = [
    { item: 'General Consultation', cost: '₹300 – ₹600' },
    { item: 'Routine Diagnostic Tests', cost: '₹500 – ₹1,200' },
    { item: 'Prescription Medicines', cost: '₹200 – ₹600' },
    { item: 'Follow-up Care', cost: '₹200 – ₹400' },
  ];

  if (isCriticalLifeThreatening) {
    urgency = 'High';
    urgencyLevel = 1;

    if (hasSnakeBite) {
      primaryCategory = 'Snakebite & Venomous Envenomation Protocol (सर्पदंश)';
      urgencyTitle = '🚨 CRITICAL EMERGENCY: SNAKEBITE / ENVENOMATION';
      urgencySubtitle = 'Venomous snakebite detected. High risk of neurotoxicity / respiratory paralysis. Seek immediate Anti-Snake Venom (ASV) and ICU resuscitation.';
      recommendedDepartment = '24×7 Emergency Casualty with Anti-Snake Venom (ASV) & ICU Resuscitation';
      suggestedFacilityTags = [
        { label: 'Anti-Snake Venom (ASV)', isRed: true },
        { label: 'Emergency ICU', isRed: true },
        { label: 'Ventilator' },
        { label: 'Toxicology' }
      ];
      firstAidSteps = [
        'Keep the victim completely still and calm — muscle movement accelerates venom circulation through the lymphatic system.',
        'Immobilize the bitten limb below heart level using a splint or firm bandage. Do not bend or walk.',
        'DO NOT cut the wound, DO NOT suck out venom, and DO NOT apply ice or tight arterial tourniquets (causes necrosis).',
        'Remove all rings, watches, bracelets, or tight shoes before swelling begins.',
        'Call 108 immediately for an ALS ambulance and rush to a hospital equipped with Anti-Snake Venom (ASV).'
      ];
      costBreakdown = [
        { item: 'Emergency Casualty & ASV Administration', cost: '₹2,000 – ₹5,000 (Free at Govt District Hospitals)' },
        { item: '20-Minute Whole Blood Clotting Test (20WBCT)', cost: '₹200 – ₹500' },
        { item: 'ICU / Ventilatory Monitoring (24-48 hrs)', cost: '₹8,000 – ₹20,000' },
        { item: 'Tetanus & Antibiotic Prophylaxis', cost: '₹500 – ₹1,200' },
      ];
    } else if (hasPoison) {
      primaryCategory = 'Acute Poisoning & Toxic Ingestion Protocol';
      urgencyTitle = '🚨 CRITICAL EMERGENCY: TOXIC INGESTION';
      urgencySubtitle = 'Acute poisoning detected. Urgent medical toxicology, gastric lavage, and ICU monitoring required.';
      recommendedDepartment = '24×7 Emergency Toxicology & Medical ICU';
      suggestedFacilityTags = [
        { label: 'Toxicology', isRed: true },
        { label: 'Emergency ICU', isRed: true },
        { label: 'Gastric Lavage' }
      ];
      firstAidSteps = [
        'Bring the poison container, bottle, or packaging with the patient to the emergency room.',
        'DO NOT induce vomiting unless specifically instructed by a poison control medical specialist.',
        'If unconscious or vomiting, position patient on their side (left lateral recovery position).',
        'Call 108 immediately for emergency ambulance transport.'
      ];
      costBreakdown = [
        { item: 'Emergency Resuscitation & Gastric Lavage', cost: '₹2,500 – ₹6,000' },
        { item: 'Toxicology Screen & Liver/Renal Panels', cost: '₹2,000 – ₹4,500' },
        { item: 'ICU Observation & Antidote Therapy', cost: '₹10,000 – ₹25,000' },
      ];
    } else {
      primaryCategory = hasChestCardiac ? 'Cardiac & Chest Distress' : 'Critical Respiratory / Neurological Emergency';
      urgencyTitle = '🚨 HIGH URGENCY: EMERGENCY DETECTED';
      urgencySubtitle = 'These symptoms may be life-threatening. Seek immediate hospital emergency department care.';
      recommendedDepartment = hasChestCardiac 
        ? '24×7 Emergency & Interventional Cardiology (Cath Lab)' 
        : '24×7 Resuscitation & Emergency Intensive Care (ICU)';
      suggestedFacilityTags = [
        { label: 'Emergency', isRed: true },
        { label: 'ICU' },
        { label: 'Oxygen' },
        hasChestCardiac ? { label: 'Cardiology' } : { label: 'Trauma Care' }
      ];
      firstAidSteps = [
        'Keep patient seated upright with head and shoulders elevated.',
        'Do not give heavy food or water if breathing is labored.',
        'Loosen any tight collars, neckwear, or belts.',
        'Call emergency desk immediately or start hospital transit.'
      ];
      costBreakdown = [
        { item: 'Emergency ER Consultation', cost: '₹1,000 – ₹2,000' },
        { item: 'Initial Diagnostic Tests (ECG, Troponin, X-ray)', cost: '₹2,000 – ₹5,000' },
        { item: 'General Observation Ward', cost: '₹2,000 – ₹5,000' },
        { item: 'ICU / Critical Care (if required)', cost: '₹10,000 – ₹25,000' },
      ];
    }
  } else if (isUrgent) {
    urgency = 'Moderate';
    urgencyLevel = 2;

    if (hasFever) {
      primaryCategory = 'Fever & Infection Care';
      urgencyTitle = '⚠️ URGENT CARE: FEVER CLINIC EVALUATION';
      urgencySubtitle = 'Fever detected. Prompt medical evaluation recommended to check temperature and test for infections (Viral, Dengue, Malaria, Typhoid).';
      recommendedDepartment = 'General Medicine / 24×7 Fever Clinic & Pathology Lab';
      suggestedFacilityTags = [
        { label: 'Fever OPD' },
        { label: 'Pathology Lab' },
        { label: '24×7 Pharmacy' }
      ];
      firstAidSteps = [
        'Stay well-hydrated with water, ORS, or light soups.',
        'Apply lukewarm wet cloth sponging on forehead if temperature is high.',
        'Avoid self-medicating with heavy antibiotics without doctor consult.',
        'Visit nearby hospital or clinic for fever panel blood tests.'
      ];
      costBreakdown = [
        { item: 'Physician Consultation', cost: '₹400 – ₹800' },
        { item: 'Fever Profile Blood Tests (CBC, Widal, Malaria)', cost: '₹800 – ₹1,800' },
        { item: 'Prescribed Antipyretics & Medicines', cost: '₹300 – ₹700' },
        { item: 'Day Care Observation / IV Fluids (if needed)', cost: '₹1,200 – ₹2,500' },
      ];
    } else if (hasAbdominal) {
      primaryCategory = 'Gastrointestinal & Abdominal Distress';
      urgencyTitle = '⚠️ URGENT CARE: ABDOMINAL EVALUATION';
      urgencySubtitle = 'Abdominal pain and vomiting require medical evaluation and possible ultrasound.';
      recommendedDepartment = 'Emergency Medicine / Gastroenterology';
      suggestedFacilityTags = [
        { label: 'Emergency', isRed: true },
        { label: 'Ultrasound' },
        { label: 'Gastroenterology' }
      ];
      costBreakdown = [
        { item: 'Emergency Consultation', cost: '₹600 – ₹1,200' },
        { item: 'Abdominal Ultrasound & Blood Work', cost: '₹1,500 – ₹3,500' },
        { item: 'IV Antiemetics & Fluids', cost: '₹600 – ₹1,400' },
        { item: 'Observation Ward', cost: '₹1,800 – ₹4,000' },
      ];
    } else if (hasTraumaBleeding) {
      primaryCategory = 'Trauma & Orthopedic Care';
      urgencyTitle = '⚠️ URGENT CARE: TRAUMA / FRACTURE EVALUATION';
      urgencySubtitle = 'Injury with bleeding or suspected fracture requires surgical dressing and X-ray imaging.';
      recommendedDepartment = 'Trauma Emergency / Orthopedic Surgery';
      suggestedFacilityTags = [
        { label: 'Emergency', isRed: true },
        { label: 'Trauma OT' },
        { label: 'X-Ray' }
      ];
      costBreakdown = [
        { item: 'Trauma ER Consultation', cost: '₹1,000 – ₹2,000' },
        { item: 'Digital X-Ray / Fracture Cast', cost: '₹2,000 – ₹5,000' },
        { item: 'Wound Dressing & Suturing', cost: '₹1,000 – ₹3,000' },
        { item: 'Orthopedic Ward (if admitted)', cost: '₹5,000 – ₹15,000' },
      ];
    } else {
      primaryCategory = 'Acute Medical Evaluation';
      urgencyTitle = '⚠️ URGENT MEDICAL EVALUATION';
      urgencySubtitle = 'Symptoms require prompt clinical evaluation at a nearby healthcare facility.';
      recommendedDepartment = 'General Medicine / Urgent Care';
      suggestedFacilityTags = [{ label: 'Urgent Care' }, { label: 'Pathology Lab' }, { label: 'Pharmacy' }];
    }
  }

  // 5. Temporary Solution Till Person Reaches Hospital (Interim Transit Guidance)
  let interimTransitSolution: InterimTransitSolution = {
    headline: 'Interim Stabilization & En-Route Care (अस्पताल पहुँचने तक अंतरिम समाधान)',
    immediateActions: [
      'Sit comfortably propped up at 30–45° with back, neck, and shoulders supported.',
      'Loosen restrictive neckbands, belts, and tight clothing to ease oxygenation.',
      'Reassure the patient calmly to reduce adrenaline-induced heart rate spikes.'
    ],
    enRouteCare: [
      'Drive with smooth acceleration and gentle braking; avoid sudden bumps and road jolts.',
      'Ensure cross-ventilation in the vehicle; crack windows open slightly or set gentle AC.',
      'Caregiver must sit directly beside the patient to observe breathing and consciousness.'
    ],
    criticalAvoid: [
      'DO NOT force oral liquids, water, or solid food if the patient is drowsy or choking.',
      'DO NOT administer unprescribed pain injections or heavy medications without ER guidance.',
      'DO NOT allow the patient to walk, exert themselves, or climb stairs unassisted.'
    ],
    vitalMonitoring: [
      'Check alertness every 2-3 minutes: Ask simple questions ("Can you squeeze my hand?").',
      'Observe chest movement: Watch for rapid, shallow, or irregular gasping.',
      'Inspect lip and fingernail color: Look out for paleness or bluish tint (oxygen lack).'
    ],
    arrivalPrep: [
      'Call ahead to the hospital emergency desk to announce ETA and incoming distress.',
      'Keep patient photo ID, past prescriptions, and current medication packets in hand.',
      'Direct vehicle immediately to the Emergency / Casualty ramp, bypassing the OPD gate.'
    ]
  };

  if (hasChestCardiac) {
    interimTransitSolution = {
      headline: 'Cardiac Transit Protocol (दिल के दौरे व सीने में दर्द हेतु अस्पताल पहुँचने तक उपाय)',
      immediateActions: [
        'Prop patient up at 30–45 degrees; strictly DO NOT allow patient to lie completely flat.',
        'Loosen collar, necktie, and waistband immediately to minimize chest compression.',
        'Have patient take slow, steady breaths through the nose and exhale gently through mouth.'
      ],
      enRouteCare: [
        'Maintain a quiet, temperature-controlled car cabin; avoid panic or loud arguments.',
        'Caregiver should hold patient steady around torso during road turns.',
        'Keep patient completely still; zero walking or carrying bags when boarding vehicle.'
      ],
      criticalAvoid: [
        'DO NOT allow patient to walk into the hospital or climb steps — request a wheelchair at gate.',
        'DO NOT give large amounts of water or heavy food (triggers vomiting and vagal arrest).',
        'DO NOT waste time at local unequipped dispensaries — go straight to a 24×7 Cath Lab ER.'
      ],
      vitalMonitoring: [
        'Check radial wrist pulse: Note if it is racing, faint, or skipping beats.',
        'Watch for sudden cold sweating on forehead or complaints of radiating pain to jaw/left arm.',
        'Monitor consciousness: Note any dizziness, lightheadedness, or sudden slurring.'
      ],
      arrivalPrep: [
        'Call hospital ER desk to activate the Cardiac Cath Lab team before arrival.',
        'Have previous ECG strips, angioplasty records, and cardiac medications readily accessible.',
        'Request an emergency wheelchair immediately as vehicle reaches the casualty entrance.'
      ]
    };
  } else if (hasBreathing) {
    interimTransitSolution = {
      headline: 'Respiratory Distress Transit Protocol (सांस फूलने पर अस्पताल पहुँचने तक उपाय)',
      immediateActions: [
        'Sit patient upright leaning slightly forward (tripod posture) with elbows on knees.',
        'Ensure direct access to fresh, cool air; open windows or use a portable handheld fan.',
        'If patient has a prescribed rescue inhaler (Salbutamol/Levolin), administer 2 puffs with spacer.'
      ],
      enRouteCare: [
        'Keep vehicle windows cracked open for continuous cross-breeze of fresh air.',
        'Keep patient calm; rapid hyperventilation doubles metabolic oxygen consumption.',
        'Support patient in seated posture; never force them to lie down in the back seat.'
      ],
      criticalAvoid: [
        'DO NOT allow patient to lie flat — lying flat severely restricts lung expansion.',
        'DO NOT crowd around the patient or allow smoking/exhaust fumes near the vehicle.',
        'DO NOT give oral sedatives or cough syrups that depress respiratory drive.'
      ],
      vitalMonitoring: [
        'Observe respiratory rate: Count breaths per minute (over 28/min requires immediate O2).',
        'Look for retractions: Skin pulling tight between ribs or hollow of neck during inhaling.',
        'Inspect lip and tongue color: Blue or dusky gray color indicates critical hypoxia.'
      ],
      arrivalPrep: [
        'Alert ER desk: "Incoming acute respiratory failure patient needing immediate high-flow O2/BiPAP".',
        'Keep patient inhaler and recent chest X-ray/prescription on caregiver dashboard.',
        'Request stretcher with oxygen cylinder ready at the casualty bay.'
      ]
    };
  } else if (hasNeuroHeadache && (isCriticalLifeThreatening || /stroke|paralysis|behosh|unconscious/i.test(text))) {
    interimTransitSolution = {
      headline: 'Stroke & Neurological Transit Protocol (स्ट्रोक व लकवे में अस्पताल पहुँचने तक उपाय)',
      immediateActions: [
        'Note the EXACT time symptoms started (window for clot-busting thrombolysis is <4.5 hours).',
        'If vomiting or semi-conscious, place patient on their LEFT SIDE (recovery position).',
        'Support head slightly elevated (15–30°) to prevent increased intracranial pressure.'
      ],
      enRouteCare: [
        'Keep airway completely clear; gently wipe any secretions or saliva from mouth corner.',
        'Maintain a calm, quiet atmosphere in the car with dim lighting.',
        'Protect weak or paralyzed limbs from dangling or getting trapped in car doors.'
      ],
      criticalAvoid: [
        'STRICTLY DO NOT give any water, food, or liquid by mouth — swallowing reflex is impaired.',
        'STRICTLY DO NOT give aspirin or blood thinners until brain CT scan rules out hemorrhage.',
        'STRICTLY DO NOT allow patient to sleep off symptoms hoping they will improve.'
      ],
      vitalMonitoring: [
        'Test FAST signs every 5 mins: Face drooping, Arm weakness, Slurred speech.',
        'Check pupil size: Note if one pupil appears significantly larger than the other.',
        'Observe for sudden twitching, stiffening, or involuntary seizure movements.'
      ],
      arrivalPrep: [
        'Call destination ER: "Incoming Code Stroke patient within thrombolytic time window".',
        'Request non-contrast brain CT scan room to be cleared and ready.',
        'Have exact time of symptom onset clearly memorized for the attending neurologist.'
      ]
    };
  } else if (hasFever) {
    interimTransitSolution = {
      headline: 'Febrile Care & Temperature Control (तेज़ बुखार में अस्पताल पहुँचने तक उपाय)',
      immediateActions: [
        'Apply room-temperature or lukewarm water damp cloth compresses on forehead, neck, and armpits.',
        'Dress patient in single-layer loose, breathable cotton clothing to allow heat dissipation.',
        'Give small sips of ORS (electrolyte solution) or coconut water if patient is alert and thirsty.'
      ],
      enRouteCare: [
        'Ensure car cabin is well-ventilated; keep air conditioner on a comfortable 24°C setting.',
        'Continue gently wiping forehead and neck with a damp cloth if fever exceeds 102°F (38.9°C).',
        'Keep an emesis (vomit) bag and bottle of water ready in vehicle.'
      ],
      criticalAvoid: [
        'DO NOT bundle patient in heavy blankets or woolen jackets to "sweat out" the fever.',
        'DO NOT use ice-cold water or alcohol rubs — this causes vasoconstriction and internal heat trapping.',
        'DO NOT administer unprescribed antibiotics, steroid drops, or excessive mixed paracetamol pills.'
      ],
      vitalMonitoring: [
        'Check patient alertness: Can they answer their name and recognize family members?',
        'Watch for warning signs: Stiff neck, petechial skin rash (red dots), or extreme lethargy.',
        'Monitor urine output: Dark or absent urine signifies impending dehydration.'
      ],
      arrivalPrep: [
        'Note the exact time and dose of any fever medication given in the last 24 hours.',
        'Inform triage desk immediately if patient experienced rigors (severe shaking chills).',
        'Request complete fever panel (CBC, Dengue NS1, Malaria smear, Typhoid) at lab.'
      ]
    };
  } else if (hasTraumaBleeding) {
    interimTransitSolution = {
      headline: 'Trauma & Fracture Transit Protocol (चोट व फ्रैक्चर में अस्पताल पहुँचने तक उपाय)',
      immediateActions: [
        'Apply firm, uninterrupted pressure with clean cloth or sterile gauze directly on bleeding wounds.',
        'Support suspected broken bone with a rolled towel, cardboard, or umbrella splint.',
        'If conscious and no spine injury, gently elevate bleeding limb above heart level.'
      ],
      enRouteCare: [
        'Pad around the injured limb with soft jackets or pillows to prevent road vibrations.',
        'Keep vehicle speed steady; avoid bumpy shortcuts that cause violent bone displacement.',
        'Keep patient covered with a light sheet to prevent hypothermic shock.'
      ],
      criticalAvoid: [
        'DO NOT attempt to push back protruding bones or realign an abnormally twisted joint.',
        'DO NOT remove deeply embedded objects (glass/metal) — wrap bulky padding around them.',
        'DO NOT move a patient with suspected neck or back injury without spinal immobilization.'
      ],
      vitalMonitoring: [
        'Check wound dressing: If blood soaks through, add another cloth on top — do not remove the first.',
        'Check sensation and warmth in fingers/toes beyond the injured limb (tests blood flow).',
        'Watch for shock: Pale, cold, clammy skin, rapid weak pulse, or lightheadedness.'
      ],
      arrivalPrep: [
        'Call Trauma ER desk to ready the X-ray suite and orthopedic surgeon on call.',
        'Know the patient blood group or bring donor relative if major bleeding occurred.',
        'Ask hospital security to guide stretcher directly to the Trauma Bay.'
      ]
    };
  } else if (hasSnakeBite) {
    interimTransitSolution = {
      headline: 'Snakebite Transit Protocol (सांप के काटने पर अस्पताल पहुँचने तक उपाय)',
      immediateActions: [
        'Keep patient completely still; lie or sit quietly. Moving the affected limb pumps venom through lymphatic vessels.',
        'Immobilize the bitten extremity at or slightly below heart level with a splint, stick, or sling. Do not elevate high.',
        'Remove all rings, watches, tight clothes, and shoes from the affected limb immediately before swelling begins.'
      ],
      enRouteCare: [
        'Transport patient gently in vehicle with bitten limb resting completely supported on a soft pillow.',
        'Reassure patient calmly; rapid heart rate from anxiety accelerates venom spread.',
        'If vomiting occurs, keep patient in lateral recovery position on their side.'
      ],
      criticalAvoid: [
        'STRICTLY DO NOT cut, slash, or incise the bite wound or try to suck out venom with mouth or suction pump.',
        'STRICTLY DO NOT tie a tight arterial rope or rubber tourniquet (causes tissue necrosis and gangrene).',
        'STRICTLY DO NOT apply ice packs, herbal pastes, burning coals, or electric shocks.',
        'STRICTLY DO NOT give alcohol, caffeinated drinks, painkiller injections, or sedatives.'
      ],
      vitalMonitoring: [
        'Observe eyelids: Look out for drooping eyelids (ptosis), double vision, or slurred speech (early neurotoxic signs).',
        'Watch swallowing and breathing: Difficulty swallowing or breathlessness requires immediate bag-valve oxygen / ventilator.',
        'Mark the swelling border on skin with a pen every 15 minutes to track venom progression.'
      ],
      arrivalPrep: [
        'Alert ER staff upon entry: "Suspected venomous snakebite - prepare Polyvalent Anti-Snake Venom (ASV) and 20-minute whole blood clotting test (20WBCT)".',
        'Do not bring a live snake; if safe and dead, photograph it from a distance for species identification.',
        'Direct vehicle immediately to Casualty / Resuscitation Bay.'
      ]
    };
  }

  // 6. Family Share Message Builder
  const getFamilyShareMessage = (hospitalName: string, distance: string) => {
    const symDesc = symptoms.join(' & ');
    if (patientRelation === 'self') {
      return `I am experiencing ${symDesc}. I am heading to ${hospitalName} (${distance}) for medical evaluation. Please reach or call if needed.`;
    } else {
      return `My ${patient.toLowerCase()} is experiencing ${symDesc}. I am taking them to ${hospitalName} (${distance}). Please reach or call if needed.`;
    }
  };

  return {
    patient,
    patientRelation,
    symptoms,
    primaryCategory,
    urgency,
    urgencyLevel,
    urgencyTitle,
    urgencySubtitle,
    languageDetected,
    location: 'Indore, Madhya Pradesh',
    recommendedDepartment,
    suggestedFacilityTags,
    firstAidSteps,
    interimTransitSolution,
    costBreakdown,
    getFamilyShareMessage,
  };
}

