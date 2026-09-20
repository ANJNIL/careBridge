import React, { useState } from 'react';
import { Copy, Check, FileText, Download, ShieldCheck, Sparkles, Layers, Terminal } from 'lucide-react';

export const PMSpecificationView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopySpec = () => {
    const el = document.getElementById('full-markdown-spec');
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-4 py-6 text-slate-200">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              PRD & Solution Architecture Document
            </span>
            <span className="text-xs font-mono text-slate-400">v2.4 • Hackathon Certified</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            CareBridge: Emergency Healthcare Navigator
          </h2>
          <p className="text-xs text-slate-400">
            Author: Lead Product Manager & Principal Healthcare Solution Architect
          </p>
        </div>

        <button
          id="copy-full-spec-btn"
          onClick={handleCopySpec}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Spec Copied to Clipboard!' : 'Copy Full Specification'}</span>
        </button>
      </div>

      {/* Structured Document Content */}
      <div id="full-markdown-spec" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 font-sans text-xs sm:text-sm leading-relaxed">
        {/* Section 1: Executive Summary & Objective */}
        <section className="space-y-3 border-b border-slate-800 pb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-rose-500">1.</span> Executive Summary & Core Objective
          </h3>
          <p className="text-slate-300">
            <strong>CareBridge Emergency Healthcare Navigator</strong> is a mission-critical, multilingual clinical routing system engineered to eliminate delays during the medical <em>Golden Hour</em>. When medical emergencies strike, distressed family members frequently wander between fragmented facilities that lack open ICU beds, Cath Labs, or emergency antivenoms. CareBridge closes this loop by combining multilingual speech-to-text with structured urgency triage (Level 1: Critical, Level 2: Urgent, Level 3: Non-Urgent) and matchmaking that filters candidate hospitals against verified real-time resource availability.
          </p>
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200">
            <strong>CRITICAL NON-DIAGNOSTIC MANDATE:</strong> The system strictly does NOT diagnose medical conditions. It translates freeform distress into structured urgency triage levels and mandatory facility readiness (e.g., Cath Lab, Level-1 Trauma OT) to guide transit routing and alert incoming ER desks.
          </div>
        </section>

        {/* Section 2: Functional Specification */}
        <section className="space-y-4 border-b border-slate-800 pb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-rose-500">2.</span> Comprehensive Functional Specification
          </h3>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">2.1 Multilingual Speak-to-Text & Hinglish Parsing</h4>
            <p className="text-slate-300">
              Emergency distress in India rarely adheres to pure grammatical English or textbook Hindi. Users mix languages spontaneously under adrenaline (e.g. <em>"Mere father ko chest pain hai and saans lene mein dikat hai"</em>). CareBridge deploys a dual-tier ASR engine:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li><strong>Tier 1:</strong> Client-side Web Speech API / native mobile ASR capturing Hindi (hi-IN), English (en-IN), Tamil (ta-IN), Telugu (te-IN), and Marathi (mr-IN).</li>
              <li><strong>Tier 2 (Gemini 3.8 Flash):</strong> Code-mixing normalizer and semantic extractor that maps colloquial distress cues into standardized medical risk taxonomy.</li>
            </ul>

            <h4 className="font-bold text-white text-sm mt-3">2.2 Structured Triage Scoring System</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg">
                <span className="font-bold text-red-400 block mb-1">Level 1: Immediate / Critical</span>
                <p className="text-slate-300">Life-threatening. Immediate resuscitation required (Acute coronary syndrome, polytrauma, stroke, severe respiratory distress). Routes only to Level-1 Trauma/Cath Lab centers with available ICU beds.</p>
              </div>
              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg">
                <span className="font-bold text-amber-400 block mb-1">Level 2: Urgent</span>
                <p className="text-slate-300">Potentially life-threatening or severe pain (Compound fractures, deep lacerations, persistent vomiting, high pediatric fever). Routes to hospitals with 24/7 ER.</p>
              </div>
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
                <span className="font-bold text-emerald-400 block mb-1">Level 3: Non-Urgent</span>
                <p className="text-slate-300">Stable emergency (Sprains, minor suturing, mild allergic reaction). Safe for community urgent care clinics.</p>
              </div>
            </div>

            <h4 className="font-bold text-white text-sm mt-3">2.3 Hospital Matchmaking Algorithm</h4>
            <p className="text-slate-300">
              Unlike generic map apps that sort solely by geographical distance, CareBridge ranks hospitals using a multi-factor fitness score:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-300 border border-slate-800">
              Score = 100 - (ETA_min * Weight_Triage) + (ICU_Available * 25) + (Capability_Match * 15) - (Missing_Crucial_Resource * 50)
            </div>
            <p className="text-slate-400 text-xs">
              <em>Critical Rule:</em> If a patient has Level 1 Cardiac Distress, a clinic 2 minutes away with 0 ICU beds is heavily penalized, directing the ambulance to the tertiary center 8 minutes away with a ready Cath Lab.
            </p>

            <h4 className="font-bold text-white text-sm mt-3">2.4 Standardized SBAR & Digital Handshake</h4>
            <p className="text-slate-300">
              Before arrival, CareBridge generates an ISO-13485 compliant SBAR card (Situation, Background, Assessment, Recommendation) and transmits it to the hospital ER dashboard. An encrypted offline QR code & token (<code className="text-rose-400">CB-XXXX</code>) is presented to the triage desk for zero-form registration.
            </p>
          </div>
        </section>

        {/* Section 3: Technical Architecture */}
        <section className="space-y-4 border-b border-slate-800 pb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-rose-500">3.</span> System Architecture & Low-Bandwidth Resilience
          </h3>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2">
            <div className="text-amber-400 font-bold">// HIGH-LEVEL ARCHITECTURE FLOW</div>
            <div>[Mobile Client (Patient/Caregiver)]</div>
            <div>   │── Web Speech ASR (hi-IN, en-IN, ta-IN, te-IN, mr-IN)</div>
            <div>   │── Geolocation API (HTML5 / Android Core GPS)</div>
            <div>   │── Local Clinical Heuristic Fallback (Offline Layer)</div>
            <div>   ▼</div>
            <div>[CareBridge Express / Node API Gateway]</div>
            <div>   ├── POST /api/triage ──▶ [Gemini 3.8 Flash Engine] (Multilingual & SBAR Extraction)</div>
            <div>   ├── GET /api/hospitals ──▶ [Matchmaking Engine & Bed Telemetry Cache]</div>
            <div>   ├── POST /api/dispatches ──▶ [Persistent Postgres/Supabase Registry]</div>
            <div>   └── PATCH /api/dispatches/:id/status ──▶ [Live Webhook / WebSocket Broadcast]</div>
            <div>   ▼</div>
            <div>[Hospital ER Management Portal]</div>
            <div>   ├── Live Incoming Patient Queue & Audio Distress Pings</div>
            <div>   ├── Resource Capacity Sliders (ICU, O2 Beds, Ventilators)</div>
            <div>   └── Pre-Arrival Handshake QR Scanner</div>
          </div>

          <div className="space-y-2 text-slate-300">
            <h4 className="font-bold text-white text-sm">Low-Bandwidth Resilience Strategy:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Offline Heuristic Fallback:</strong> If network latency exceeds 2.5s or internet disconnects, client/server rule-based regex immediately evaluates triage levels and nearest cached facilities with 0ms delay.</li>
              <li><strong>Zero-Data SMS Panic Mode:</strong> When cellular packet data drops to 2G/EDGE, CareBridge compresses GPS coordinates, triage urgency, and distress codes into a 160-character GSM SMS string transmitted directly to 108/112 towers.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: ASCII Wireframes */}
        <section className="space-y-4 border-b border-slate-800 pb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-rose-500">4.</span> Key Screen Designs & ASCII Wireframes
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-1">
                4.1 Mobile (Patient): Distress Input Screen (Pulsing Mic)
              </h4>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] sm:text-xs font-mono text-slate-300 overflow-x-auto leading-none">
{`+-----------------------------------------------+
|  CareBridge Emergency Navigator     [SOS 108] |
+-----------------------------------------------+
|  [!] NON-DIAGNOSTIC GUIDANCE ONLY             |
+-----------------------------------------------+
|  1. Select Language:                          |
|  [ Hindi ] [ English ] [ தமிழ் ] [ తెలుగు ]   |
+-----------------------------------------------+
|                                               |
|                    (( O ))                    |
|                [ PULSING MIC ]                |
|               "Tap & Speak Now"               |
|                                               |
|  "Mere father ko chest pain hai and saans..." |
+-----------------------------------------------+
|  [ Type symptoms manually...                ] |
|  [====== ANALYZE DISTRESS & FIND HOSPITAL =====] |
+-----------------------------------------------+`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-1">
                4.2 Mobile (Patient): Urgency Guidance & Ranked Hospital List
              </h4>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] sm:text-xs font-mono text-slate-300 overflow-x-auto leading-none">
{`+-----------------------------------------------+
| [!] TRIAGE: LEVEL 1 IMMEDIATE / CRITICAL      |
| Signals: Retrosternal Chest Distress, Dyspnea |
+-----------------------------------------------+
| Required Facilities:                          |
| [✓ Cath Lab] [✓ Trauma OT L1] [✓ ICU Bed]     |
+-----------------------------------------------+
| RANKED HOSPITALS (Matched by Capacity & ETA)  |
| 1. Metro Apex Trauma Centre (ETA: 8m • 3.2km) |
|    ICU: 6 Available | O2: 14 | Cath Lab: Ready |
|    [ Map Route ]   [ Pre-Alert ER (SBAR) ]    |
|-----------------------------------------------|
| 2. City Memorial Civil Hospital (ETA: 12m)    |
|    ICU: 4 Available | O2: 22 | Govt Free Wing |
+-----------------------------------------------+`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-1">
                4.3 Mobile (Patient): Map Routing with SBAR Share Button
              </h4>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] sm:text-xs font-mono text-slate-300 overflow-x-auto leading-none">
{`+-----------------------------------------------+
|  Emergency Routing -> Metro Apex Trauma       |
|  ETA: 8 mins | Distance: 3.2 km | Traffic: Green |
+-----------------------------------------------+
|  [========== LIVE MAP TRANSIT CANVAS ========] |
|  (Origin: BKC) ===(Arterial Flyover)==> [ER]  |
+-----------------------------------------------+
|  Turn 1: Merge onto Western Express Flyover   |
|  Turn 2: Emergency Bay Exit 4 into Trauma OT  |
+-----------------------------------------------+
|  [ Send SBAR to ER Desk ]  [ Show QR Handshake ]
|  [ Call ER Hotline: +91 22 2410 7911 ]        |
+-----------------------------------------------+`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-1">
                4.4 Web (Hospital): Emergency Dashboard (Incoming Patients List)
              </h4>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] sm:text-xs font-mono text-slate-300 overflow-x-auto leading-none">
{`+-----------------------------------------------------------------------------+
| HOSPITAL COMMAND PORTAL: Metro Apex Trauma Centre    [Token Scanner: CB-____] |
+-----------------------------------------------------------------------------+
| INCOMING DISTRESS QUEUE (3 En Route)                                        |
| • [L1 CRITICAL] Rajesh Sharma (58M) | ETA: 7m | SBAR Ready | [Pre-Clear ER] |
| • [L2 URGENT]   Priya Nair (34F)    | ETA: 14m| Fracture   | [Reserve Bed]  |
+-----------------------------------------------------------------------------+
| CLINICAL SBAR CARD INSPECTOR (Patient: Rajesh Sharma):                      |
| [S] 58M severe retrosternal pain, diaphoresis, dyspnea.                     |
| [B] Diabetic, Hypertensive. Spoken in Hinglish via CareBridge ASR.           |
| [A] Suspected Acute Coronary Syndrome (STEMI equivalence). High risk.       |
| [R] Activate Code STEMI Cath Lab team; reserve ICU Bed #04.                 |
+-----------------------------------------------------------------------------+`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider mb-1">
                4.5 Web (Hospital): Resource Update Portal (ICU Bed Count Slider)
              </h4>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] sm:text-xs font-mono text-slate-300 overflow-x-auto leading-none">
{`+-----------------------------------------------+
| RESOURCE CAPACITY MANAGEMENT                  |
+-----------------------------------------------+
| Available ICU Beds:                           |
| [----●-----------------]  6 / 35 Available    |
+-----------------------------------------------+
| Available Oxygen Beds:                        |
| [---------●------------]  14 / 60 Available   |
+-----------------------------------------------+
| Ventilators Ready:                            |
| [----●-----------------]  5 Ready             |
+-----------------------------------------------+
| [ PUBLISH LIVE BED COUNTS TO PATIENT NETWORK ]|
+-----------------------------------------------+`}
              </pre>
            </div>
          </div>
        </section>

        {/* Section 5: The Winning Hackathon Twist */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-rose-500">5.</span> The Winning Hackathon Twist
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-rose-500/40 rounded-xl space-y-2">
              <span className="font-bold text-rose-400 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Twist 1: Zero-Data GSM SMS Panic Mode
              </span>
              <p className="text-xs text-slate-300">
                In India's tier-2/3 highways, basements, or congested disaster zones, mobile data (4G/5G) frequently drops to zero. Standard mapping applications fail completely. CareBridge packages user GPS, urgency triage classification, and distress signals into a single standardized 160-character GSM SMS packet (<code className="text-rose-300">CB#SOS#T1#LAT19.076#LON72.877#CHEST_PAIN#TO_HOSP1</code>) dispatched via SMS gateway to 108/112 towers with 100% offline survivability.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2">
              <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Twist 2: Pre-Arrival Digital Handshake & QR
              </span>
              <p className="text-xs text-slate-300">
                Patients who arrive at crowded Indian ERs typically spend 15–20 critical minutes filling out handwritten triage slips while the patient decompensates in the hallway. CareBridge eliminates this with the <em>Pre-Arrival Digital Handshake</em>. While transit is underway, the hospital holds the ICU bed, pre-clears triage, and assigns a token (<code className="text-emerald-300">CB-XXXX</code>). Upon arrival, the ambulance staff or caregiver simply presents the QR code, wheeling directly into resuscitation bay 2.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
