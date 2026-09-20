import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_HOSPITALS } from './src/data/hospitals';
import { DistressTriageResult, Hospital, IncomingEmergencyDispatch, AIProblemAnalysisResult, TriageLevel } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory state for live demo and synchronized hospital-patient loop
let hospitalsState: Hospital[] = [...INITIAL_HOSPITALS];
let emergencyDispatches: IncomingEmergencyDispatch[] = [
  {
    id: 'disp-initial-1',
    patientName: 'Rajesh Sharma (Caregiver: Amit)',
    patientAge: 58,
    patientGender: 'Male',
    phone: '+91 98201 54321',
    triageLevel: 1,
    sbar: {
      situation: '58M acute severe retrosternal chest pain (onset 25 mins ago) with profuse diaphoresis and dyspnea.',
      background: 'Hypertensive, Diabetic for 8 years on Metformin. Spoken via Hinglish distress: "Mere father ko chest pain hai and saans lene mein dikkat ho rahi hai."',
      assessment: 'Suspected Acute Coronary Syndrome (STEMI equivalence) requiring emergent Cath Lab intervention. Vital instability risk high.',
      recommendation: 'Pre-activate Catheterization Lab and Code STEMI team. Keep ICU bed with non-invasive ventilator on immediate standby.'
    },
    symptoms: ['Severe chest pain radiating to left arm', 'Dyspnea / breathing difficulty', 'Cold sweats', 'Dizziness'],
    targetHospitalId: 'hosp-1',
    targetHospitalName: 'Metro Apex Super-Specialty & Trauma Centre',
    ambulanceDispatched: true,
    ambulanceEtaMinutes: 7,
    patientLocation: {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Near Bandra Kurla Complex Junction, Mumbai'
    },
    status: 'Bed Reserved',
    digitalHandshakeToken: 'CB-9821-ACS-7',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  }
];

// Enhanced clinical fallback triage engine supporting English, Hinglish, and Hindi (Devanagari)
function getFallbackTriage(inputText: string, targetLang: string): DistressTriageResult {
  const text = (inputText || '').trim();
  const lower = text.toLowerCase();
  
  // 1. Language Detection
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hindiWords = /\b(mujhe|hai|hain|ho|rahi|raha|mein|aur|se|ko|tez|bahut|dikkat|dard|haddi|chot|bukhaar|bukhar|saans|mere|papa|mummy|bhai|seene|chhati)\b/i;
  const detectedLanguage = hasDevanagari ? 'हिन्दी (Hindi)' : (hindiWords.test(lower) ? 'Hinglish / Hindi' : (targetLang === 'ta' ? 'Tamil' : targetLang === 'te' ? 'Telugu' : 'English'));

  // 2. High-Precision Clinical Distress Signals (covers English, Romanized Hinglish, and Devanagari)
  const isChestCardiac = /chest\s*pain|heart\s*attack|chhati|seene|seena|dil|cardiac|angina|palpitation|left\s*arm\s*pain|cold\s*sweats|सीने\s*में\s*दर्द|छाती\s*में\s*दर्द|दिल\s*का\s*दौरा|हार्ट\s*अटैक|छाती|हृदय/i.test(text);
  const isBreathing = /saans|breath|dyspnea|gasping|suffocat|asthma|dum\s*ghut|dam|asphyxia|wheez|stridor|bluish|cyanosis|सांस|साँस|सांस\s*फूल|सांस\s*लेने\s*में\s*तकलीफ|दम\s*घुटना|सांस\s*की\s*तकलीफ/i.test(text);
  const isStrokeNeuro = /stroke|paralysis|facial\s*droop|slurr|speech|unconscious|behosh|coma|seizure|dora|daura|fits|convulsion|faint|unresponsive|लकवा|पैरालिसिस|बेहोश|बेहोशी|दौरा|मिर्गी|मूर्छा/i.test(text);
  const isMajorTraumaBleeding = /heavy\s*bleed|arterial|hemorrhage|head\s*injury|accident|compound\s*fracture|khun\s*bah|khoon\s*bah|severe\s*accident|खून\s*बह|रक्तस्राव|गंभीर\s*चोट|सिर\s*की\s*चोट|दुर्घटना|एक्सीडेंट/i.test(text);
  
  // Comprehensive Snakebite & Venomous Envenomation detection (covers Hindi Devanagari, Romanized Hinglish, & English)
  const isSnakeBite = /saanp|saap|snake|viper|cobra|krait|envenom|सांप|साँप|सर्प|नाग|करैत/i.test(text) ||
    /(सांप|साँप|सर्प|नाग|bichhu|bichhoo|बिच्छू).*(काट|डस|डंक)/i.test(text) ||
    /(काट|डस|डंक).*(सांप|साँप|सर्प|नाग|bichhu|bichhoo|बिच्छू)/i.test(text) ||
    /snake.*(bite|bit|bitten)/i.test(text) ||
    /(bite|bitten).*snake/i.test(text);

  const isPoison = /poison|zahar|toxic|chemical|overdose|insecticide|pesticide|acid\s*ingestion|विष|जहर|कीटनाशक|तेजाब\s*पी/i.test(text);
  const isAnimalBite = /dog\s*bite|kutta|rabies|monkey\s*bite|animal\s*bite|कुत्ता|काटा|काट\s*लिया/i.test(text);
  const isPoisonBite = isSnakeBite || isPoison || isAnimalBite;

  const isSevereBurn = /severe\s*burn|aag\s*se\s*jal|extensive\s*burn|acid\s*burn|जलना|आग|तेजाब|झुलस/i.test(text);
  const isPediatricCritical = /(bacha|bachha|baby|child|infant)\s*(saans|gasping|blue|unconscious|vomit)|बच्चा\s*(सांस|बेहोश|नीला)/i.test(text);

  const isFever = /bukhaar|bukhar|fever|tap|taap|taav|temperature|pyrexia|chills|thand|kampan|बुखार|ताप|ठंड|कंपकंपी|गरमी/i.test(text);
  const isAbdominal = /pet\s*dard|stomach|abdominal|ulti|vomit|dast|diarrhea|loose\s*motion|food\s*poison|पेट\s*दर्द|उल्टी|दस्त|मरोड़/i.test(text);
  const isFractureMinorTrauma = /fracture|haddi|bone\s*broken|sprain|dislocation|chot|cut|wound|हड्डी\s*टूटना|फ्रैक्चर|चोट|घाव|मोच/i.test(text);
  const isHeadacheDizzy = /sar\s*dard|sir\s*dard|headache|migraine|chakkar|dizzy|vertigo|सिर\s*दर्द|चक्कर|घूमना/i.test(text);

  // 3. Urgency Classification - Snakebite & Toxic Poisoning are life-threatening Level 1 emergencies
  const isLevel1 = isChestCardiac || isBreathing || isStrokeNeuro || isMajorTraumaBleeding || isSnakeBite || isPoison || isSevereBurn || isPediatricCritical;
  const isLevel2 = isFever || isAbdominal || isFractureMinorTrauma || isHeadacheDizzy || isAnimalBite;
  const level: TriageLevel = isLevel1 ? 1 : (isLevel2 ? 2 : 3);
  const category: 'Immediate / Critical' | 'Urgent' | 'Non-Urgent' = level === 1 
    ? 'Immediate / Critical' 
    : (level === 2 ? 'Urgent' : 'Non-Urgent');

  // 4. Extract Key Signals
  const keySignals: string[] = [];
  if (isSnakeBite) keySignals.push('Venomous snakebite (सांप का काटना) / Suspected neurotoxic or hemotoxic envenomation');
  if (isPoison) keySignals.push('Acute toxic substance ingestion / systemic poisoning');
  if (isChestCardiac) keySignals.push('Retrosternal chest distress / suspected acute cardiac episode');
  if (isBreathing) keySignals.push('Acute respiratory distress / airway compromise');
  if (isStrokeNeuro) keySignals.push('Acute neurological deficit / altered consciousness / seizure');
  if (isMajorTraumaBleeding) keySignals.push('Trauma / active hemorrhage / critical injury');
  if (isSevereBurn) keySignals.push('Severe thermal / chemical burn injury');
  if (isAnimalBite && !isSnakeBite) keySignals.push('Animal bite / post-exposure rabies prophylaxis needed');
  if (isFever) keySignals.push('Elevated body temperature / acute febrile illness (Bukhaar)');
  if (isAbdominal) keySignals.push('Acute abdominal distress / gastroenteritis / vomiting');
  if (isFractureMinorTrauma) keySignals.push('Suspected bone fracture / musculoskeletal injury');
  if (isHeadacheDizzy) keySignals.push('Severe cephalalgia / dizziness / neurological evaluation');
  if (keySignals.length === 0) keySignals.push('General medical consultation needed');

  // 5. Match Specialties & Facility
  const specialties: string[] = [];
  if (isSnakeBite) specialties.push('Anti-Snake Venom (ASV) Center', '24/7 Critical Care & ICU', 'Emergency Ventilator Support');
  if (isPoison) specialties.push('Medical Toxicology & Gastric Lavage', 'ICU Resuscitation');
  if (isChestCardiac) specialties.push('24/7 Cath Lab (Interventional Cardiology)', 'Cardiac ICU');
  if (isBreathing) specialties.push('Critical Care & Pulmonology', 'High-Flow Oxygen & Ventilators');
  if (isStrokeNeuro) specialties.push('Neurology & Stroke Code Unit', 'Emergency CT/MRI');
  if (isMajorTraumaBleeding || isFractureMinorTrauma) specialties.push('Trauma OT Level-1', 'Orthopedic Surgery');
  if (isFever) specialties.push('General Medicine (Fever Clinic)', '24/7 Pathology Lab (Blood Work)');
  if (isAbdominal) specialties.push('Gastroenterology & Emergency Surgery', 'Diagnostic Ultrasound');
  if (specialties.length === 0) specialties.push('24/7 Emergency Medicine & Urgent Care');

  const suggestedFacilityType = level === 1
    ? (isSnakeBite 
        ? 'Tertiary Hospital with 24/7 Emergency, Anti-Snake Venom (ASV) & ICU Support' 
        : (isChestCardiac 
            ? 'Super-Specialty Cardiac & Cath Lab Emergency Center' 
            : 'Super-Specialty Level-1 Trauma & Critical Care Center'))
    : (isFever ? 'Hospital with 24×7 Fever Clinic & Emergency Pathology Lab' : 'General Hospital with 24/7 ER & Diagnostic Imaging');

  // 6. First Aid Instructions
  const immediateFirstAidGuidance: string[] = [];
  if (isChestCardiac) {
    immediateFirstAidGuidance.push(
      'Keep patient seated upright (30–45 degrees) with head and shoulders supported.',
      'Loosen tight clothing around neck, chest, and waist to ease breathing.',
      'Do not give heavy food or water; keep patient calm and avoid any physical exertion.',
      'Prepare ECG records, previous cardiac history, and dispatch emergency ambulance immediately.'
    );
  } else if (isBreathing) {
    immediateFirstAidGuidance.push(
      'Sit the patient completely upright; do not allow them to lie flat.',
      'Ensure adequate ventilation, open windows or fan the area.',
      'Loosen constrictive collars, neckties, and belts immediately.',
      'If patient has a prescribed rescue inhaler, assist them in taking it while waiting for transport.'
    );
  } else if (isSnakeBite) {
    immediateFirstAidGuidance.push(
      'Keep the victim calm, still, and resting quietly; muscle movement accelerates venom circulation through the lymphatic system.',
      'Immobilize the bitten limb at or slightly below heart level with a splint or bandage. Strictly avoid walking or bending.',
      'DO NOT cut the wound, DO NOT suck out the venom, and DO NOT apply ice packs or tight arterial tourniquets.',
      'Remove all rings, watches, bracelets, or tight shoes immediately before swelling begins.',
      'Call 108 immediately for an ALS ambulance and rush to a hospital equipped with Anti-Snake Venom (ASV).'
    );
  } else if (isPoison) {
    immediateFirstAidGuidance.push(
      'Identify the exact ingested substance, bottle, or packaging and bring it to the hospital ER.',
      'DO NOT induce vomiting unless explicitly directed by a poison control toxicologist.',
      'If vomiting occurs, turn patient to the left lateral recovery position to keep airway clear.',
      'Rush immediately to an emergency hospital with ICU gastric lavage and resuscitation facilities.'
    );
  } else if (isStrokeNeuro) {
    immediateFirstAidGuidance.push(
      'Note the exact time symptoms started (critical for thrombolysis window).',
      'If unconscious or vomiting, place patient in the lateral recovery position on their side.',
      'Do not give anything by mouth (no water, food, or aspirin) to prevent aspiration choking.',
      'Immediately head to a hospital with active CT scanner and Stroke Code team.'
    );
  } else if (isFever) {
    immediateFirstAidGuidance.push(
      'Apply lukewarm water sponge compresses to the forehead, neck, and underarms to safely lower body temperature.',
      'Keep patient well-hydrated with clean water, ORS (oral rehydration solution), or coconut water.',
      'Avoid unprescribed antibiotics; take paracetamol as directed by a doctor.',
      'Visit a 24/7 hospital or clinic for fever panel blood investigations (CBC, Dengue, Malaria, Typhoid).'
    );
  } else if (isMajorTraumaBleeding || isFractureMinorTrauma) {
    immediateFirstAidGuidance.push(
      'Apply firm, continuous direct pressure with a clean cloth over bleeding wounds.',
      'Immobilize the injured limb; do not attempt to straighten or push back broken bones.',
      'Elevate the injured area above the level of the heart if bleeding permits.',
      'Keep patient warm and transport immediately to a facility with Trauma OT.'
    );
  } else {
    immediateFirstAidGuidance.push(
      'Rest in a comfortable, quiet, well-ventilated area.',
      'Keep hydrated with small sips of clean water or fluids.',
      'Monitor temperature and vital signs closely.',
      'Consult a physician promptly if discomfort persists or worsens.'
    );
  }

  // 7. Temporary Solution Till Reaching Hospital (Interim Transit Protocol)
  let interimTransitSolution = {
    headline: 'Interim Stabilization & En-Route Care (अस्पताल पहुँचने तक अंतरिम समाधान)',
    immediateActions: [
      'Rest patient in a calm, semi-propped position (30–45°) with head and shoulders supported.',
      'Loosen restrictive neckbands, belts, and tight clothing to ease oxygen intake.',
      'Speak in calm, reassuring tones to prevent panic and elevated cardiac strain.'
    ],
    enRouteCare: [
      'Drive with smooth acceleration and gentle braking; avoid sudden jolts.',
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

  if (isChestCardiac) {
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
        'DO NOT allow patient to walk into the hospital or climb steps — use a wheelchair at gate.',
        'DO NOT give large amounts of water or heavy food (triggers vomiting and vagal arrest).',
        'DO NOT waste time at local homeopathic or unequipped nursing homes — go straight to Cath Lab ER.'
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
  } else if (isBreathing) {
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
  } else if (isStrokeNeuro) {
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
  } else if (isFever) {
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
  } else if (isMajorTraumaBleeding || isFractureMinorTrauma) {
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
  } else if (isSnakeBite) {
    interimTransitSolution = {
      headline: 'Snakebite & Envenomation Transit Protocol (सांप के काटने पर अस्पताल पहुँचने तक उपाय)',
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

  return {
    detectedLanguage,
    originalText: inputText,
    englishTranslation: inputText,
    keySignals,
    triageLevel: level,
    triageCategory: category,
    urgencyReasoning: level === 1 
      ? `Critical Level 1 distress indicators detected (${keySignals.slice(0, 2).join('; ')}). Requires immediate level-1 hospital facilities with 24/7 resuscitation, ICU, and specialist on standby.`
      : (isFever 
          ? 'Acute febrile illness detected. Prompt clinical evaluation and diagnostic blood work required to rule out systemic infections (Dengue, Malaria, Typhoid).'
          : `Urgent clinical evaluation recommended to stabilize symptoms and prevent deterioration (${keySignals[0]}).`),
    requiredSpecialties: specialties,
    immediateFirstAidGuidance,
    interimTransitSolution,
    safetyDisclaimer: 'NON-DIAGNOSTIC TRIAGE GUIDANCE: This analysis prioritizes emergency facility navigation and hospital readiness. It is not a clinical diagnosis. Always call 108/112 in emergencies.',
    suggestedFacilityType,
    criticalGoldenHourAlert: level === 1,
    sbar: {
      situation: `Patient presenting with ${keySignals.join(', ')}. Urgency classification: Level ${level} (${category}).`,
      background: `Initiated via CareBridge voice distress in ${detectedLanguage}: "${text.slice(0, 120)}"`,
      assessment: `Triage evaluation for ${keySignals[0]}. Requires facility with ${specialties.slice(0, 2).join(' & ')}.`,
      recommendation: level === 1 ? `Direct ambulance dispatch, pre-alert hospital ER trauma desk, hold ICU bed.` : `Guide patient to nearest 24/7 hospital with ${specialties[0]}.`
    }
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CareBridge Emergency Navigator Engine' });
});

// Real-time Hospitals API
app.get('/api/hospitals', (req, res) => {
  res.json({ hospitals: hospitalsState });
});

// Hospital ER staff updates ICU / Oxygen beds
app.post('/api/hospitals/:id/update-resources', (req, res) => {
  const { id } = req.params;
  const { icuBedsAvailable, oxygenBedsAvailable, generalBedsAvailable, ventilatorsAvailable } = req.body;

  const index = hospitalsState.findIndex(h => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Hospital not found' });
  }

  hospitalsState[index] = {
    ...hospitalsState[index],
    ...(icuBedsAvailable !== undefined && { icuBedsAvailable: Math.max(0, Number(icuBedsAvailable)) }),
    ...(oxygenBedsAvailable !== undefined && { oxygenBedsAvailable: Math.max(0, Number(oxygenBedsAvailable)) }),
    ...(generalBedsAvailable !== undefined && { generalBedsAvailable: Math.max(0, Number(generalBedsAvailable)) }),
    ...(ventilatorsAvailable !== undefined && { ventilatorsAvailable: Math.max(0, Number(ventilatorsAvailable)) }),
    lastUpdatedMinutesAgo: 0,
  };

  res.json({ success: true, hospital: hospitalsState[index] });
});

// List Dispatches for Hospital Dashboard
app.get('/api/dispatches', (req, res) => {
  res.json({ dispatches: emergencyDispatches });
});

// Patient Mobile app submits pre-arrival alert & SBAR
app.post('/api/dispatches', (req, res) => {
  const { patientName, patientAge, patientGender, phone, triageResult, targetHospitalId, targetHospitalName, location, ambulanceDispatched } = req.body;

  const newDispatch: IncomingEmergencyDispatch = {
    id: `disp-${Date.now()}`,
    patientName: patientName || 'Emergency Patient (Caregiver Assisted)',
    patientAge: Number(patientAge) || 45,
    patientGender: patientGender || 'Unspecified',
    phone: phone || '+91 98000 00000',
    triageLevel: triageResult.triageLevel,
    sbar: triageResult.sbar,
    symptoms: triageResult.keySignals,
    targetHospitalId: targetHospitalId || 'hosp-1',
    targetHospitalName: targetHospitalName || 'Metro Apex Super-Specialty & Trauma Centre',
    ambulanceDispatched: Boolean(ambulanceDispatched),
    ambulanceEtaMinutes: 8,
    patientLocation: location || {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Current GPS Location'
    },
    status: 'Pre-Arrival Alert',
    digitalHandshakeToken: `CB-${Math.floor(1000 + Math.random() * 9000)}-T${triageResult.triageLevel}`,
    timestamp: new Date().toISOString(),
  };

  emergencyDispatches = [newDispatch, ...emergencyDispatches];
  res.json({ success: true, dispatch: newDispatch });
});

// Hospital ER Staff updates incoming patient status
app.patch('/api/dispatches/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const dispatch = emergencyDispatches.find(d => d.id === id);
  if (!dispatch) {
    return res.status(404).json({ error: 'Dispatch not found' });
  }

  dispatch.status = status;
  res.json({ success: true, dispatch });
});

// Helper function to call Gemini with automatic model cascade (gemini-3.8-flash -> gemini-flash-latest)
async function callGeminiWithCascade(ai: GoogleGenAI, prompt: string): Promise<string> {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Gemini model ${model} attempt failed:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini model attempts failed');
}

function cleanAndParseJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Gemini response as JSON, using clinical fallback:', err);
    return fallback;
  }
}

// Triage & Multilingual Parsing Endpoint using Gemini cascade
app.post('/api/triage', async (req, res) => {
  const { inputText, languageCode } = req.body;

  if (!inputText || typeof inputText !== 'string') {
    return res.status(400).json({ error: 'Input text or voice transcription is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('Using local clinical heuristic triage engine (GEMINI_API_KEY not configured)');
    return res.json(getFallbackTriage(inputText, languageCode || 'hi'));
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are the triage and language parsing engine for the "CareBridge Emergency Healthcare Navigator", operating in India.
CRITICAL MANDATE:
1. NON-DIAGNOSTIC REQUIREMENT: You must NOT provide a definitive clinical medical diagnosis. Instead, accurately assess urgency triage level:
   - Level 1: Immediate / Critical (Life-threatening: venomous snakebite [सांप ने काट लिया, सर्पदंश, cobra/viper bite - high mortality without immediate ASV], acute poisoning/chemical ingestion, chest pain/suspected heart attack, acute respiratory failure, stroke signs, unconsciousness, heavy bleeding, major accident trauma)
   - Level 2: Urgent (Prompt medical examination needed: dog bite [rabies post-exposure prophylaxis], fever with chills/body ache, acute abdominal pain, suspected bone fracture, deep lacerations, vomiting/diarrhea with dehydration, asthma flare-up)
   - Level 3: Non-Urgent (Mild illness, cold, routine cough, mild sprain, chronic rash, general checkup)
2. MULTILINGUAL & CODE-MIXING SUPPORT: The user input may be in Hindi (Devanagari or Romanized), English, Tamil, Telugu, Marathi, or colloquial Hinglish (e.g. "मुझे सांप ने काट लिया है अब क्या करूं" or "Mere father ko chest pain hai" or "mujhe bukhaar h" or "मुझे तेज बुखार है").
Accurately identify all distress signals, translate if needed, and assess triage score.
IMPORTANT ENVENOMATION & LIFE-THREATENING RULES:
- Venomous snakebites ('सांप ने काट लिया', 'सांप का काटना', 'सर्पदंश', 'snake bite', 'saanp ne kaat liya') are ALWAYS Level 1: Immediate / Critical. Required specialties MUST include 'Anti-Snake Venom (ASV) Center', '24/7 Resuscitation & ICU', and 'Emergency Ventilator Support'. First aid and transit MUST emphasize: strict limb immobilization below heart level, zero exertion/walking, do NOT cut, do NOT suck venom, do NOT apply ice or tight tourniquets, and call 108 immediately.
3. OUTPUT A FORMAL SBAR (Situation, Background, Assessment, Recommendation) card for emergency hospital handoff.
4. SUGGEST TEMPORARY INTERIM CARE TILL PERSON REACHES HOSPITAL:
   Provide interim stabilization instructions covering: immediate actions, en-route vehicle transit care, critical contraindications to avoid, vital signs to monitor, and hospital gate arrival preparation.

User Distress Input: "${inputText}"
Preferred Language Hint: "${languageCode || 'auto'}"

Respond STRICTLY with valid JSON following this schema:
{
  "detectedLanguage": "string",
  "originalText": "string",
  "englishTranslation": "string",
  "keySignals": ["string"],
  "triageLevel": 1,
  "triageCategory": "Immediate / Critical",
  "urgencyReasoning": "string",
  "requiredSpecialties": ["string"],
  "immediateFirstAidGuidance": ["string"],
  "interimTransitSolution": {
    "headline": "string",
    "immediateActions": ["string"],
    "enRouteCare": ["string"],
    "criticalAvoid": ["string"],
    "vitalMonitoring": ["string"],
    "arrivalPrep": ["string"]
  },
  "safetyDisclaimer": "NON-DIAGNOSTIC TRIAGE GUIDANCE: This analysis prioritizes hospital resource matching and does not substitute professional medical diagnosis. Call 108/112 immediately.",
  "suggestedFacilityType": "Super-Specialty Trauma / Cardiac Emergency Center",
  "criticalGoldenHourAlert": true,
  "sbar": {
    "situation": "string",
    "background": "string",
    "assessment": "string",
    "recommendation": "string"
  }
}`;

    const responseText = await callGeminiWithCascade(ai, prompt);
    const fallbackResult = getFallbackTriage(inputText, languageCode || 'hi');
    const parsed: DistressTriageResult = cleanAndParseJson<DistressTriageResult>(responseText, fallbackResult);

    // Enforce safety disclaimer
    parsed.safetyDisclaimer = 'NON-DIAGNOSTIC TRIAGE GUIDANCE: This analysis prioritizes emergency facility navigation and ER desk readiness. It is not a clinical diagnosis. Always call 108/112 in emergencies.';

    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini triage error, failing gracefully to clinical fallback heuristic:', err);
    res.json(getFallbackTriage(inputText, languageCode || 'hi'));
  }
});

// Heuristic fallback for AI Problem & Hospital Auto-Analysis
function getFallbackAIAnalysis(
  problem: string,
  specificNeeds: string[] = [],
  hospitals: Hospital[] = hospitalsState,
  patientAge?: number | string,
  patientGender?: string
): AIProblemAnalysisResult {
  const text = (problem || '').trim();
  const lower = text.toLowerCase();

  // 1. Distress checks
  const isChestCardiac = /chest\s*pain|heart\s*attack|chhati|seene|seena|dil|cardiac|angina|palpitation|left\s*arm\s*pain|cold\s*sweats|सीने\s*में\s*दर्द|छाती\s*में\s*दर्द|दिल\s*का\s*दौरा|हार्ट\s*अटैक|छाती|हृदय/i.test(text);
  const isBreathing = /saans|breath|dyspnea|gasping|suffocat|asthma|dum\s*ghut|dam|asphyxia|wheez|stridor|bluish|cyanosis|सांस|साँस|सांस\s*फूल|सांस\s*लेने\s*में\s*तकलीफ|दम\s*घुटना/i.test(text);
  const isStrokeNeuro = /stroke|paralysis|facial\s*droop|slurr|speech|unconscious|behosh|coma|seizure|dora|daura|fits|convulsion|faint|unresponsive|लकवा|पैरालिसिस|बेहोश|बेहोशी|दौरा|मिर्गी/i.test(text);
  const isMajorTraumaBleeding = /heavy\s*bleed|arterial|hemorrhage|head\s*injury|accident|compound\s*fracture|khun\s*bah|khoon\s*bah|severe\s*accident|खून\s*बह|रक्तस्राव|गंभीर\s*चोट|सिर\s*की\s*चोट|दुर्घटना|एक्सीडेंट/i.test(text);

  const isSnakeBite = /saanp|saap|snake|viper|cobra|krait|envenom|सांप|साँप|सर्प|नाग|करैत/i.test(text) ||
    /(सांप|साँप|सर्प|नाग|bichhu|bichhoo|बिच्छू).*(काट|डस|डंक)/i.test(text) ||
    /(काट|डस|डंक).*(सांप|साँप|सर्प|नाग|bichhu|bichhoo|बिच्छू)/i.test(text) ||
    /snake.*(bite|bit|bitten)/i.test(text) ||
    /(bite|bitten).*snake/i.test(text);

  const isPoison = /poison|zahar|toxic|chemical|overdose|insecticide|pesticide|acid\s*ingestion|विष|जहर|कीटनाशक|तेजाब\s*पी/i.test(text);
  const isAnimalBite = /dog\s*bite|kutta|rabies|monkey\s*bite|animal\s*bite|कुत्ता|काटा|काट\s*लिया/i.test(text);
  const isPoisonBite = isSnakeBite || isPoison || isAnimalBite;

  const isSevereBurn = /severe\s*burn|aag\s*se\s*jal|extensive\s*burn|acid\s*burn|जलना|आग|तेजाब/i.test(text);
  const isPediatricCritical = /(bacha|bachha|baby|child|infant)\s*(saans|gasping|blue|unconscious|vomit)|बच्चा\s*(सांस|बेहोश|नीला)/i.test(text) || (patientAge && Number(patientAge) < 12 && isBreathing);

  const isFever = /bukhaar|bukhar|fever|tap|taap|taav|temperature|pyrexia|chills|thand|kampan|बुखार|ताप|ठंड|कंपकंपी/i.test(text);
  const isAbdominal = /pet\s*dard|stomach|abdominal|ulti|vomit|dast|diarrhea|loose\s*motion|food\s*poison|पेट\s*दर्द|उल्टी|दस्त/i.test(text);
  const isFractureMinorTrauma = /fracture|haddi|bone\s*broken|sprain|dislocation|chot|cut|wound|हड्डी\s*टूटना|फ्रैक्चर|चोट|घाव|मोच/i.test(text);
  const isHeadacheDizzy = /sar\s*dard|sir\s*dard|headache|migraine|chakkar|dizzy|vertigo|सिर\s*दर्द|चक्कर/i.test(text);

  const isLevel1 = isChestCardiac || isBreathing || isStrokeNeuro || isMajorTraumaBleeding || isSnakeBite || isPoison || isSevereBurn || isPediatricCritical;
  const isLevel2 = isFever || isAbdominal || isFractureMinorTrauma || isHeadacheDizzy || isAnimalBite;

  const urgencyLevel = isLevel1 ? 1 : (isLevel2 ? 2 : 3);
  const urgencyLabel = urgencyLevel === 1 
    ? (isSnakeBite ? 'Level 1: Snakebite Emergency (सर्पदंश)' : 'Level 1: Immediate / Critical') 
    : (urgencyLevel === 2 ? 'Level 2: Urgent' : 'Level 3: Non-Urgent');

  const complaints: string[] = [];
  if (isSnakeBite) complaints.push('Venomous snakebite (सांप का काटना) / Envenomation risk');
  if (isPoison) complaints.push('Acute toxic poisoning / chemical ingestion');
  if (isChestCardiac) complaints.push('Retrosternal chest distress / suspected acute coronary syndrome');
  if (isBreathing) complaints.push('Acute respiratory distress / compromised airway');
  if (isStrokeNeuro) complaints.push('Acute focal neurological deficit / altered consciousness / stroke signs');
  if (isMajorTraumaBleeding) complaints.push('Active heavy hemorrhage / traumatic poly-trauma');
  if (isAnimalBite && !isSnakeBite) complaints.push('Animal bite / post-exposure rabies prophylaxis needed');
  if (isSevereBurn) complaints.push('Extensive thermal burn injury');
  if (isFever) complaints.push('Acute febrile episode (Bukhaar / Elevated temperature)');
  if (isAbdominal) complaints.push('Acute abdominal distress / gastroenteritis / vomiting');
  if (isFractureMinorTrauma) complaints.push('Musculoskeletal trauma / suspected bone fracture');
  if (isHeadacheDizzy) complaints.push('Severe cephalalgia / vestibular dizziness');
  if (complaints.length === 0) complaints.push('Acute medical distress requiring clinical evaluation');

  const specialties: string[] = [];
  if (isSnakeBite) specialties.push('Anti-Snake Venom (ASV) Center', '24/7 ICU & Ventilator Resuscitation');
  if (isPoison) specialties.push('Medical Toxicology & ICU Resuscitation');
  if (isChestCardiac || specificNeeds.some((n) => /cardiac|cath/i.test(n))) specialties.push('Interventional Cardiology (24/7 Cath Lab)');
  if (isStrokeNeuro || specificNeeds.some((n) => /neuro/i.test(n))) specialties.push('Neurology & Stroke Code Unit');
  if (isMajorTraumaBleeding || isFractureMinorTrauma || specificNeeds.some((n) => /trauma/i.test(n))) specialties.push('Trauma OT & Orthopedic Surgery');
  if (isBreathing || specificNeeds.some((n) => /oxygen|ventilator/i.test(n))) specialties.push('Pulmonology & Critical Care ICU');
  if (isFever) specialties.push('General Medicine (Fever Clinic) & 24/7 Pathology Lab');
  if (isAbdominal) specialties.push('Gastroenterology & Emergency Observation');
  if (isPediatricCritical || specificNeeds.some((n) => /pediatric/i.test(n))) specialties.push('Pediatric Intensive Care (PICU)');
  if (specialties.length === 0) specialties.push('24/7 Emergency Medicine & Critical Care');

  // Evaluate candidate hospitals against acute problem and specific needs
  const rankedRecommendations = hospitals.map((h) => {
    let score = 92 - h.etaMinutes * (urgencyLevel === 1 ? 3 : 1.5);
    const keyAdvantages: string[] = [];
    const limitations: string[] = [];

    // Bed availability
    if (h.icuBedsAvailable > 0) {
      score += 15;
      keyAdvantages.push(`${h.icuBedsAvailable} ICU beds ready`);
    } else {
      score -= 30;
      limitations.push('Zero vacant ICU beds at present');
    }

    if (h.oxygenBedsAvailable > 0) {
      score += 6;
      keyAdvantages.push(`${h.oxygenBedsAvailable} Oxygen beds active`);
    }

    if (h.ventilatorsAvailable > 0) {
      keyAdvantages.push(`${h.ventilatorsAvailable} Ventilators on standby`);
    }

    // Snakebite & ASV matching
    if (isSnakeBite) {
      if (h.capabilities.some(c => /snake|venom|asv|toxic/i.test(c)) || h.traumaLevel === 1) {
        score += 35;
        keyAdvantages.push('24/7 Anti-Snake Venom (ASV) Stock & ICU Resuscitation');
      }
    }

    // Trauma & Specialty matching
    if (isChestCardiac && h.capabilities.some(c => /cath|cardiac/i.test(c))) {
      score += 25;
      keyAdvantages.push('24/7 Cath Lab & Interventional Cardiology Team');
    }

    if ((isMajorTraumaBleeding || isFractureMinorTrauma) && h.traumaLevel === 1) {
      score += 20;
      keyAdvantages.push('Tertiary Level-1 Trauma Surgical OT');
    } else if (h.traumaLevel === 3 && urgencyLevel === 1) {
      score -= 25;
      limitations.push('Community clinic lacks dedicated Level-1 emergency resuscitation OT');
    }

    if (isFever && h.capabilities.some(c => /blood|er|icu/i.test(c))) {
      score += 10;
      keyAdvantages.push('24/7 Diagnostic Pathology & Emergency OPD');
    }

    if (h.etaMinutes <= 8) {
      keyAdvantages.push(`Fast response ETA (${h.etaMinutes} mins)`);
    }

    // Specific Needs Evaluation
    specificNeeds.forEach((need) => {
      const match = h.capabilities.some((cap) =>
        cap.toLowerCase().includes(need.toLowerCase().slice(0, 4))
      );
      if (match) {
        score += 12;
        keyAdvantages.push(`Matches explicit need: ${need}`);
      }
    });

    const fitScore = Math.min(99, Math.max(25, Math.round(score)));
    const fitTier: 'Best Match' | 'Strong Alternative' | 'Secondary Option' =
      fitScore >= 85 ? 'Best Match' : fitScore >= 65 ? 'Strong Alternative' : 'Secondary Option';

    let aiRationale = '';
    if (fitTier === 'Best Match') {
      aiRationale = `${h.name} is the #1 recommended best hospital for your condition. It provides ${h.icuBedsAvailable} vacant ICU beds, Level-${h.traumaLevel} resuscitation facilities, and a fast ETA of ${h.etaMinutes} mins, ensuring life-saving intervention within the Golden Hour.`;
    } else if (fitTier === 'Strong Alternative') {
      aiRationale = `A solid emergency alternative located ${h.distanceKm} km (${h.etaMinutes} mins) away with ${h.icuBedsAvailable} ICU beds available, well-suited if primary tertiary facility experiences surge.`;
    } else {
      aiRationale = `Secondary option with ${h.icuBedsAvailable} ICU beds; suitable for urgent stabilization but lacks dedicated high-volume specialized OT for Level-1 trauma.`;
    }

    return {
      hospitalId: h.id,
      hospitalName: h.name,
      fitScore,
      fitTier,
      aiRationale,
      keyAdvantages,
      potentialLimitations: limitations.length > 0 ? limitations : undefined,
      urgencyReadiness: `${h.icuBedsAvailable} ICU Beds • ${h.etaMinutes}m ETA`,
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  const firstAidSteps: string[] = [];
  if (isChestCardiac) {
    firstAidSteps.push(
      'Keep patient seated upright (30–45 degrees) with back and shoulders supported.',
      'Loosen tight clothing around neck, chest, and waist to ease respiration.',
      'Do not give heavy food or water; keep patient calm and avoid any physical exertion.',
      'Prepare ECG records, previous cardiac history, and dispatch emergency ambulance immediately.'
    );
  } else if (isBreathing) {
    firstAidSteps.push(
      'Sit the patient completely upright; do not allow them to lie flat.',
      'Ensure adequate ventilation, open windows or fan the area.',
      'Loosen constrictive collars, neckties, and belts immediately.',
      'Assist patient with prescribed rescue inhaler if available while waiting for transport.'
    );
  } else if (isFever) {
    firstAidSteps.push(
      'Apply lukewarm wet towel compresses on forehead, neck, and underarms to safely lower body temperature.',
      'Keep patient well-hydrated with clean water, ORS, or electrolyte fluids.',
      'Avoid unprescribed antibiotics; visit a 24/7 clinic for fever panel blood tests.',
      'Prepare patient ID and health cards for doctor evaluation.'
    );
  } else {
    firstAidSteps.push(
      'Maintain patient in a comfortable semi-upright position with head elevated (30-45 degrees).',
      'Loosen restrictive neckwear, shirts, collars, and belts to aid respiration.',
      'Do not administer oral food, water, or medication if choking, vomiting, or dyspneic.',
      'Keep patient calm, minimize physical exertion, and prepare health ID and medication history.'
    );
  }

  return {
    analysisSummary: `Clinical triage assessment indicates ${urgencyLabel}. Chief symptoms: ${complaints.join(', ')}. Priority recommendation is emergency dispatch to a facility with ${specialties.slice(0, 2).join(' & ')} to ensure stabilization under the critical Golden Hour window.`,
    urgencyLevel: urgencyLevel as TriageLevel,
    urgencyLabel,
    chiefComplaints: complaints,
    recommendedSpecialties: specialties,
    clinicalConsiderations: [
      urgencyLevel === 1
        ? 'High probability of time-critical vital instability. Golden hour protocol must be initiated immediately.'
        : 'Urgent hospital evaluation advised to prevent secondary complications.',
      'Ensure continuous SpO2 and hemodynamic monitoring upon first-responder arrival.',
      specificNeeds.length > 0 ? `Explicit patient preferences factored: ${specificNeeds.join(', ')}` : 'Standard critical emergency protocol applied.'
    ],
    estimatedTimeWindow: urgencyLevel === 1 ? 'Under 15-30 minutes (Golden Hour Protocol)' : 'Within 45-60 minutes',
    firstAidSteps,
    matchedHospitalRecommendations: rankedRecommendations,
    safetyDisclaimer: 'NON-DIAGNOSTIC AI TRIAGE GUIDANCE: This analysis prioritizes hospital resource allocation and emergency navigation. It is NOT a clinical diagnosis. Call 108 or 112 immediately in life-threatening distress.',
    sbar: {
      situation: `Acute presentation: ${complaints.join(', ')}. Triage Level ${urgencyLevel} (${urgencyLabel}).`,
      background: `Distress reported: "${text.slice(0, 110)}". Specific requirements: ${specificNeeds.join(', ') || 'Standard emergency care'}.`,
      assessment: `High probability of acute medical/trauma emergency requiring ${specialties.slice(0, 2).join(', ')}.`,
      recommendation: `Dispatch priority ambulance to ${rankedRecommendations[0]?.hospitalName || 'nearest hospital'}, hold ICU bed, pre-alert ER trauma desk.`
    }
  };
}

// AI Problem Auto-Analysis & Needs-Aware Hospital Suggestion Endpoint
app.post('/api/ai-analyze-problem', async (req, res) => {
  const {
    problemDescription,
    patientAge,
    patientGender,
    specificNeeds = [],
    hospitals = hospitalsState,
    preferredLanguage = 'en'
  } = req.body;

  if (!problemDescription || typeof problemDescription !== 'string') {
    return res.status(400).json({ error: 'Problem description or symptom details required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('Gemini API key not found; serving clinical heuristic problem analyzer.');
    return res.json(getFallbackAIAnalysis(problemDescription, specificNeeds, hospitals, patientAge, patientGender));
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const hospitalsSummary = (hospitals && hospitals.length > 0 ? hospitals : hospitalsState).map((h: Hospital) => ({
      id: h.id,
      name: h.name,
      distanceKm: h.distanceKm,
      etaMinutes: h.etaMinutes,
      traumaLevel: h.traumaLevel,
      icuBedsAvailable: h.icuBedsAvailable,
      oxygenBedsAvailable: h.oxygenBedsAvailable,
      ventilatorsAvailable: h.ventilatorsAvailable,
      capabilities: h.capabilities,
      type: h.type
    }));

    const prompt = `You are the AI Medical Problem Analyzer & Emergency Hospital Matchmaker for "CareBridge", an emergency healthcare navigation network in India.
CRITICAL MANDATES:
1. NON-DIAGNOSTIC TRIAGE: Do NOT provide a definitive medical diagnosis. Instead, analyze urgency level (Level 1: Immediate/Critical, Level 2: Urgent, Level 3: Non-Urgent), extract chief complaints, identify required specialties, and provide step-by-step immediate first aid.
2. HOSPITAL MATCHING & RECOMMENDATIONS ACCORDING TO NEED:
Evaluate the patient's acute problem description, age, and explicit specific needs against EACH of the candidate hospitals provided below.
Rank the hospitals from best to least suitable, calculating:
- "fitScore" (number 0-100)
- "fitTier" ("Best Match" | "Strong Alternative" | "Secondary Option")
- "aiRationale": 1-2 concise, compassionate, clinical sentences explaining WHY this hospital is recommended for this specific problem (e.g. mention its active ICU bed count, ETA, Cath Lab, or pediatric facility matching their need).
- "keyAdvantages": list of 2-4 specific reasons (e.g. "8 vacant ICU beds", "6 min ETA", "24/7 Interventional Cardiology").
- "potentialLimitations": optional list of limitations (e.g. "0 ICU beds currently available", "Secondary clinic lacks trauma OT").
- "urgencyReadiness": concise tag like "Cath Lab on Standby • 8 ICU Beds Ready".

3. MULTILINGUAL INPUT: The problem description may be in English, Hindi, Hinglish, Tamil, Telugu, or code-mixed. Parse it accurately.

PATIENT INFORMATION:
- Problem / Symptoms: "${problemDescription}"
- Age: ${patientAge || 'Adult'}
- Gender: ${patientGender || 'Unspecified'}
- Specific Needs Requested by Patient / Caregiver: ${JSON.stringify(specificNeeds)}
- Preferred Language: ${preferredLanguage}

CANDIDATE HOSPITALS IN NETWORK:
${JSON.stringify(hospitalsSummary, null, 2)}

Respond STRICTLY with valid JSON following this structure:
{
  "analysisSummary": "string",
  "urgencyLevel": 1,
  "urgencyLabel": "Level 1: Immediate / Critical",
  "chiefComplaints": ["string"],
  "recommendedSpecialties": ["string"],
  "clinicalConsiderations": ["string"],
  "estimatedTimeWindow": "Within 15-30 minutes (Golden Hour Protocol)",
  "firstAidSteps": ["string"],
  "matchedHospitalRecommendations": [
    {
      "hospitalId": "hosp-1",
      "hospitalName": "Metro Apex Super-Specialty & Trauma Centre",
      "fitScore": 98,
      "fitTier": "Best Match",
      "aiRationale": "Metro Apex is your #1 recommended hospital because it has 8 vacant ICU beds, an active 24/7 Cath Lab, and the shortest ETA of 6 mins, ensuring immediate intervention within the Golden Hour window.",
      "keyAdvantages": ["8 ICU beds immediately available", "6 min response ETA", "24/7 Cath Lab"],
      "potentialLimitations": [],
      "urgencyReadiness": "Cath Lab Active • 8 ICU Beds Ready"
    }
  ],
  "safetyDisclaimer": "NON-DIAGNOSTIC AI GUIDANCE: This analysis prioritizes emergency facility navigation and hospital resource matching. It does not replace professional clinical diagnosis. Call 108/112 immediately in emergency situations.",
  "sbar": {
    "situation": "string",
    "background": "string",
    "assessment": "string",
    "recommendation": "string"
  }
}`;

    const responseText = await callGeminiWithCascade(ai, prompt);
    const fallbackResult = getFallbackAIAnalysis(problemDescription, specificNeeds, hospitals, patientAge, patientGender);
    const parsed: AIProblemAnalysisResult = cleanAndParseJson<AIProblemAnalysisResult>(responseText, fallbackResult);

    parsed.safetyDisclaimer = 'NON-DIAGNOSTIC AI GUIDANCE: This analysis prioritizes emergency hospital routing and resource allocation. It is not a clinical diagnosis. Always call 108/112 in emergencies.';

    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/ai-analyze-problem Gemini invocation, serving clinical fallback:', err);
    res.json(getFallbackAIAnalysis(problemDescription, specificNeeds, hospitals, patientAge, patientGender));
  }
});

// Vite Middleware & Production Serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareBridge Emergency Navigator running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
