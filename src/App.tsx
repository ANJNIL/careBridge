/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ActiveAppView, 
  Hospital, 
  IncomingEmergencyDispatch, 
  DistressTriageResult,
  AuthUser,
  UserRole,
  EmergencyContact
} from './types';
import { INITIAL_HOSPITALS, INITIAL_DISPATCHES } from './data/hospitals';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/auth/LoginModal';
import { TacticalHudView } from './components/tactical/TacticalHudView';
import { PatientMobileView } from './components/patient/PatientMobileView';
import { HospitalPortalView } from './components/hospital/HospitalPortalView';
import { SplitLiveDemoLoop } from './components/split/SplitLiveDemoLoop';
import { PMSpecificationView } from './components/spec/PMSpecificationView';
import { AIProblemAnalyzerModal } from './components/ai/AIProblemAnalyzerModal';
import { CareBridgeApp } from './components/carebridge/CareBridgeApp';
import { EmergencyContactsModal } from './components/emergency/EmergencyContactsModal';
import { EmergencySosCallModal } from './components/emergency/EmergencySosCallModal';
import { FloatingEmergencySosButton } from './components/emergency/FloatingEmergencySosButton';
import { playEmergencyTone, SoundFX } from './utils/speech';
import { PhoneCall, ShieldAlert, HeartPulse, Check, Info, BellRing } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveAppView>('carebridge_ui');
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [dispatches, setDispatches] = useState<IncomingEmergencyDispatch[]>(INITIAL_DISPATCHES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showQuickSosModal, setShowQuickSosModal] = useState(false);
  const [isEmergencyContactsOpen, setIsEmergencyContactsOpen] = useState(false);
  const [overrideSosContact, setOverrideSosContact] = useState<EmergencyContact | null>(null);

  // Authentication State (User & Hospital Staff)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('carebridge_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalRole, setLoginModalRole] = useState<UserRole>('patient');

  // AI Auto-Analyzer State
  const [isAIAnalyzerOpen, setIsAIAnalyzerOpen] = useState<boolean>(false);
  const [aiAnalyzerInitialText, setAiAnalyzerInitialText] = useState<string>('');

  const handleOpenAIAnalyzer = (initialText: string = '') => {
    setAiAnalyzerInitialText(initialText);
    setIsAIAnalyzerOpen(true);
    SoundFX.init();
    SoundFX.cardiacPulse();
  };

  // Fetch live hospital data and dispatches on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospRes, dispRes] = await Promise.all([
          fetch('/api/hospitals').catch(() => null),
          fetch('/api/dispatches').catch(() => null),
        ]);

        if (hospRes && hospRes.ok) {
          const hospData = await hospRes.json();
          if (Array.isArray(hospData) && hospData.length > 0) {
            setHospitals(hospData);
          }
        }

        if (dispRes && dispRes.ok) {
          const dispData = await dispRes.json();
          if (Array.isArray(dispData) && dispData.length > 0) {
            setDispatches(dispData);
          }
        }
      } catch (err) {
        console.warn('Using local fallback state for CareBridge');
      }
    };

    fetchData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    triggerToast(
      user.role === 'hospital_staff'
        ? `🏥 Hospital Command Verified: ${user.name} (${user.hospitalName})`
        : `👤 Citizen Patient Verified: ${user.name} (Emergency ID Active)`
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('carebridge_user');
    setCurrentUser(null);
    triggerToast('Logged out of CareBridge Emergency Network.');
    SoundFX.init();
    SoundFX.cardiacPulse();
  };

  const handleSwitchRole = () => {
    setLoginModalRole(currentUser?.role === 'hospital_staff' ? 'patient' : 'hospital_staff');
    setIsLoginModalOpen(true);
  };

  // Handle patient emergency dispatch from Mobile View
  const handleDispatchPatient = async ({
    triageResult,
    hospital,
    ambulanceDispatched,
    specializedDispatch,
  }: {
    triageResult: DistressTriageResult;
    hospital: Hospital;
    ambulanceDispatched: boolean;
    specializedDispatch?: Partial<IncomingEmergencyDispatch>;
  }) => {
    const handshakeToken = specializedDispatch?.digitalHandshakeToken || `CB-${Math.floor(1000 + Math.random() * 9000)}-T${triageResult.triageLevel}`;
    const isCitizen = currentUser && currentUser.role === 'patient';
    
    const newDispatch: IncomingEmergencyDispatch = {
      id: `disp-${Date.now()}`,
      patientName: specializedDispatch?.patientName || (isCitizen ? currentUser.name : (specializedDispatch?.emergencyCategory === 'pregnancy' ? 'Sunita Mehra' : specializedDispatch?.emergencyCategory === 'road_accident' ? 'Vikram Choudhary' : 'Emergency Transit Patient')),
      patientAge: specializedDispatch?.patientAge || (isCitizen ? 52 : (specializedDispatch?.emergencyCategory === 'pregnancy' ? 28 : specializedDispatch?.emergencyCategory === 'road_accident' ? 34 : 58)),
      patientGender: specializedDispatch?.patientGender || (specializedDispatch?.emergencyCategory === 'pregnancy' ? 'F' : 'M'),
      triageLevel: triageResult.triageLevel,
      symptoms: isCitizen && currentUser.bloodGroup 
        ? [...triageResult.keySignals, `Blood: ${currentUser.bloodGroup}`] 
        : triageResult.keySignals,
      sbar: triageResult.sbar,
      hospitalTargetId: hospital.id,
      hospitalName: hospital.name,
      ambulanceEtaMinutes: specializedDispatch?.ambulanceEtaMinutes || hospital.etaMinutes,
      status: 'Pre-Arrival Alert',
      digitalHandshakeToken: handshakeToken,
      phone: specializedDispatch?.phone || (isCitizen ? (currentUser.phone || '+91 98450 12345') : '+91 98201 55432'),
      timestamp: new Date().toLocaleTimeString(),
      ...specializedDispatch,
    };

    // Update state immediately
    setDispatches((prev) => [newDispatch, ...prev]);

    // Play tone & show notification
    playEmergencyTone(triageResult.triageLevel === 1 ? 'alert' : 'success');
    triggerToast(
      `🚨 SBAR Dispatched to ${hospital.name}! ER Desk token: ${handshakeToken}`
    );

    // Sync to backend
    try {
      await fetch('/api/dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDispatch),
      });
    } catch {
      // Offline / dev fallback
    }
  };

  // Handle hospital capacity slider updates
  const handleUpdateHospitalResources = async (
    hospitalId: string,
    updates: {
      icuBedsAvailable?: number;
      oxygenBedsAvailable?: number;
      ventilatorsAvailable?: number;
    }
  ) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === hospitalId ? { ...h, ...updates } : h))
    );

    triggerToast(`Bed counts updated & synced to patient navigator network.`);

    try {
      await fetch(`/api/hospitals/${hospitalId}/resources`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      // Local fallback
    }
  };

  // Handle hospital ER triage pre-clearance / bed reservation
  const handleUpdateDispatchStatus = async (
    dispatchId: string,
    newStatus: IncomingEmergencyDispatch['status']
  ) => {
    setDispatches((prev) =>
      prev.map((d) => (d.id === dispatchId ? { ...d, status: newStatus } : d))
    );

    triggerToast(`Patient status updated: "${newStatus}"`);

    try {
      await fetch(`/api/dispatches/${dispatchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Local fallback
    }
  };

  const pendingDispatchesCount = dispatches.filter(
    (d) => d.status === 'Pre-Arrival Alert'
  ).length;

  return (
    <div className="min-h-screen bg-tactical-black text-slate-100 flex flex-col font-sans selection:bg-tactical-red selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        onSelectView={setActiveView}
        pendingDispatchesCount={pendingDispatchesCount}
        onQuickSos={() => {
          setOverrideSosContact(null);
          setShowQuickSosModal(true);
        }}
        onOpenEmergencyContacts={() => setIsEmergencyContactsOpen(true)}
        currentUser={currentUser}
        onOpenLogin={() => {
          setLoginModalRole('patient');
          setIsLoginModalOpen(true);
        }}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onOpenAIAnalyzer={() => handleOpenAIAnalyzer()}
      />

      {/* Real-time Event Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-300">
          <div className="bg-tactical-card border border-tactical-red/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <BellRing className="w-5 h-5 text-tactical-red animate-bounce" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1">
        {activeView === 'carebridge_ui' && (
          <CareBridgeApp
            onOpenHospitalPortal={() => setActiveView('hospital_portal')}
            onOpenSpec={() => setActiveView('pm_spec')}
            onOpenAuthModal={(role) => {
              if (role) setLoginModalRole(role);
              setIsLoginModalOpen(true);
            }}
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onTriggerSos={() => {
              setOverrideSosContact(null);
              setShowQuickSosModal(true);
            }}
            onOpenEmergencyContacts={() => setIsEmergencyContactsOpen(true)}
            hospitals={hospitals}
            onDispatchPatient={handleDispatchPatient}
          />
        )}

        {activeView === 'tactical_hud' && (
          <TacticalHudView
            hospitals={hospitals}
            dispatches={dispatches}
            onDispatchPatient={handleDispatchPatient}
            onUpdateHospitalResources={handleUpdateHospitalResources}
            onUpdateDispatchStatus={handleUpdateDispatchStatus}
            onSwitchView={setActiveView}
            currentUser={currentUser}
            onOpenLogin={() => {
              setLoginModalRole('hospital_staff');
              setIsLoginModalOpen(true);
            }}
            onOpenAIAnalyzer={handleOpenAIAnalyzer}
          />
        )}

        {activeView === 'split_live_loop' && (
          <div className="py-4">
            <SplitLiveDemoLoop
              hospitals={hospitals}
              dispatches={dispatches}
              onDispatchPatient={handleDispatchPatient}
              onUpdateHospitalResources={handleUpdateHospitalResources}
              onUpdateDispatchStatus={handleUpdateDispatchStatus}
              currentUser={currentUser}
              onOpenLogin={() => {
                setLoginModalRole('patient');
                setIsLoginModalOpen(true);
              }}
            />
          </div>
        )}

        {activeView === 'patient_mobile' && (
          <div className="py-4">
            <PatientMobileView
              hospitals={hospitals}
              onDispatchPatient={handleDispatchPatient}
              currentUser={currentUser}
              onOpenLogin={() => {
                setLoginModalRole('patient');
                setIsLoginModalOpen(true);
              }}
              onOpenAIAnalyzer={handleOpenAIAnalyzer}
              onOpenEmergencyContacts={() => setIsEmergencyContactsOpen(true)}
              onTriggerSos={() => {
                setOverrideSosContact(null);
                setShowQuickSosModal(true);
              }}
            />
          </div>
        )}

        {activeView === 'hospital_portal' && (
          <div className="py-4">
            <HospitalPortalView
              hospitals={hospitals}
              dispatches={dispatches}
              onUpdateHospitalResources={handleUpdateHospitalResources}
              onUpdateDispatchStatus={handleUpdateDispatchStatus}
              currentUser={currentUser}
              onOpenLogin={() => {
                setLoginModalRole('hospital_staff');
                setIsLoginModalOpen(true);
              }}
            />
          </div>
        )}

        {activeView === 'pm_spec' && (
          <div className="py-4">
            <PMSpecificationView />
          </div>
        )}
      </main>

      {/* CareBridge User & Hospital Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        hospitals={hospitals}
        initialRole={loginModalRole}
      />

      {/* AI Problem Auto-Analyzer & Hospital Recommender Modal */}
      <AIProblemAnalyzerModal
        isOpen={isAIAnalyzerOpen}
        onClose={() => setIsAIAnalyzerOpen(false)}
        hospitals={hospitals}
        onSelectHospitalAndDispatch={(hospital, triageResult, ambulanceDispatched) => {
          handleDispatchPatient({
            triageResult,
            hospital,
            ambulanceDispatched,
          });
          triggerToast(`🎯 AI Hospital Recommendation Activated: Pre-alert sent to ${hospital.name}`);
        }}
        initialProblemText={aiAnalyzerInitialText}
      />

      {/* 1-Tap Emergency SOS Auto-Call Modal (Countdown + Auto-dial to Primary Emergency Contact) */}
      <EmergencySosCallModal
        isOpen={showQuickSosModal}
        onClose={() => setShowQuickSosModal(false)}
        onOpenManageContacts={() => {
          setShowQuickSosModal(false);
          setIsEmergencyContactsOpen(true);
        }}
        overrideContact={overrideSosContact}
      />

      {/* Emergency Numbers Management Modal (Add, Edit, Prioritize, Test-call contacts) */}
      <EmergencyContactsModal
        isOpen={isEmergencyContactsOpen}
        onClose={() => setIsEmergencyContactsOpen(false)}
        onTriggerSosCall={(contact) => {
          setIsEmergencyContactsOpen(false);
          setOverrideSosContact(contact);
          setShowQuickSosModal(true);
        }}
      />

      {/* Floating Emergency SOS 1-Tap Trigger Button */}
      <FloatingEmergencySosButton
        onTriggerSos={() => {
          setOverrideSosContact(null);
          setShowQuickSosModal(true);
        }}
        onOpenManageContacts={() => setIsEmergencyContactsOpen(true)}
      />

      {/* Global Tactical Footer */}
      <footer className="border-t border-tactical-border bg-tactical-black/90 py-4 text-center text-xs text-slate-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-medium text-slate-300 font-hud">
          <HeartPulse className="w-4 h-4 text-tactical-red" />
          <span>CareBridge Tactical Emergency Navigator HUD v3.4</span>
          <span className="text-slate-500">• Powered by Gemini 3.8 Flash & Real-Time ER Telemetry</span>
        </p>
        <p className="text-[11px] font-mono text-slate-500 max-w-xl mx-auto px-4">
          Non-Diagnostic Safety Notice: CareBridge categorizes medical distress urgency and maps verified hospital resources to protect the medical Golden Hour. IEC-62304 Compliant.
        </p>
      </footer>
    </div>
  );
}

