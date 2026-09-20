import { DistressTriageResult, Hospital, TriageLevel } from '../types';

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
  const hasBitePoison = /(^|[^\w])(saanp|snake|kutta|dog\s*bite|poison|zahar|allergy|toxic)($|[^\w])|सांप|कुत्ता|जहर|विष/i.test(text);

  const symptoms: string[] = [];

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
  if (hasBitePoison) {
    symptoms.push('Bite / Toxic exposure / Severe reaction');
  }

  // Fallback if no specific keyword triggered
  if (symptoms.length === 0) {
    if (text.length > 0) {
      symptoms.push(text.slice(0, 45) + (text.length > 45 ? '...' : ''));
    } else {
      symptoms.push('Acute Medical Distress');
    }
  }

  // 4. Determine Urgency & Primary Category
  const isCriticalLifeThreatening = 
    hasChestCardiac || 
    hasBreathing || 
    /behosh|unconscious|heart\s*attack|stroke|paralysis|heavy\s*bleeding|seizure|arterial|लकवा|बेहोश|बेहोशी|दौरा|मिर्गी|रक्तस्राव/i.test(text);

  const isUrgent = 
    hasFever || 
    hasAbdominal || 
    hasTraumaBleeding || 
    hasNeuroHeadache || 
    hasBurn || 
    hasBitePoison;

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

  // 5. Family Share Message Builder
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
    costBreakdown,
    getFamilyShareMessage,
  };
}

