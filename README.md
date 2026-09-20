# 🚑 CareBridge — Emergency Healthcare Navigator

CareBridge is an AI-powered emergency healthcare navigation platform designed to bridge the critical first 30 minutes of a medical crisis. It translates voice and text emergency transcripts across Indian languages (Hindi, Hinglish, English), evaluates clinical urgency and required specialty using a strictly **non-diagnostic** AI triage agent, locates nearest verified 24/7 specialized facilities, and formats structured clinical **SBAR handovers** for emergency room staff.

---

## 🏗️ Architecture

```
careBridge/
├── backend/                  # FastAPI + Google Antigravity + Supabase
│   ├── app/
│   │   ├── agent/            # EmergencyTriageAgent & skills (fetch_nearby_hospitals, generate_sbar_handover)
│   │   ├── services/         # Supabase client (24/7 filter) & Bhashini translation
│   │   ├── routes/           # POST /api/v1/agent/triage endpoint
│   │   ├── models/           # Pydantic data schemas
│   │   ├── config.py         # App configuration
│   │   └── main.py           # FastAPI application entrypoint
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Zero-configuration launcher
│   └── test_triage.py        # Automated clinical scenario verification suite
│
└── frontend/                 # Mobile-first Emergency Navigator UI
    └── index.html            # Dynamic app connected to backend (Web Speech API, Live Maps, WhatsApp export)
```

---

## ⚡ Quickstart

### 1. Start the Backend Server
```bash
cd backend
pip install -r requirements.txt
python run.py
```
* Backend URL: `http://127.0.0.1:8000`
* Interactive API Docs: `http://127.0.0.1:8000/docs`

### 2. Launch the Frontend
Open `frontend/index.html` directly in your browser, or serve it using any local static server:
```bash
# Option A: Just double-click frontend/index.html in File Explorer
# Option B: Run a lightweight server
npx serve frontend
```

---

## 🛡️ Core Safety Principles
* **Strictly Non-Diagnostic**: CareBridge never makes pathological diagnoses (e.g. it will never diagnose myocardial infarction). It strictly classifies urgency (`Critical`, `Moderate`, `Minor`) and specialty routing (`Cardiac`, `Trauma`, `Burn`, `General`).
* **Zero-Crash Resilience**: If Supabase or translation services are unreachable during a live demo, the backend seamlessly falls back to realistic emergency data and phonetic Hinglish interpreters.
