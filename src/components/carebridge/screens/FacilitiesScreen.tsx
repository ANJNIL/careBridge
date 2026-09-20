import React, { useState } from 'react';
import { Hospital, BloodBank, Pharmacy } from '../../../types';
import { 
  MapPin, 
  Settings, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  Droplets, 
  Pill,
  Clock,
  Phone,
  Radio,
  Check
} from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface FacilitiesScreenProps {
  onBack: () => void;
  hospitals: Hospital[];
  bloodBanks?: BloodBank[];
  pharmacies?: Pharmacy[];
  onSelectHospital: (hospital: Hospital) => void;
  initialFilter?: 'all' | 'hospitals' | 'emergency' | 'blood_bank' | 'pharmacy';
}

export const FacilitiesScreen: React.FC<FacilitiesScreenProps> = ({
  onBack,
  hospitals,
  bloodBanks = [],
  pharmacies = [],
  onSelectHospital,
  initialFilter = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hospitals' | 'emergency' | 'blood_bank' | 'pharmacy'>(initialFilter);
  const [currentLocation, setCurrentLocation] = useState('Indore, Madhya Pradesh');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitals[0]?.id || '');

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'hospitals', label: 'Hospitals' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'blood_bank', label: 'Blood Bank' },
    { id: 'pharmacy', label: 'Pharmacy' },
  ] as const;

  const handleProceed = () => {
    if (selectedHospital) {
      SoundFX.tapTick();
      onSelectHospital(selectedHospital);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150">
      <div className="space-y-3 pb-2 text-left">
        {/* Top Header without any back arrow clicks */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Nearby Emergency Facilities
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Verified 24x7 ERs with live ICU &amp; Cath Lab availability
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* Your Location Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block leading-none">
                Your Location
              </span>
              <span className="text-xs font-bold text-slate-800">
                {currentLocation}
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              const newLoc = prompt('Update your location (city or district):', currentLocation);
              if (newLoc) setCurrentLocation(newLoc);
            }}
            className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  SoundFX.tapTick();
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-full shrink-0 transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Facilities List */}
        <div className="space-y-2">
          {(activeTab === 'all' || activeTab === 'hospitals' || activeTab === 'emergency') && (
            <>
              {hospitals.map((hosp) => {
                const isSelected = hosp.id === selectedHospitalId;
                return (
                  <div
                    key={hosp.id}
                    id={`card-facility-${hosp.id}`}
                    onClick={() => {
                      SoundFX.tapTick();
                      setSelectedHospitalId(hosp.id);
                    }}
                    className={`rounded-2xl border p-3.5 flex items-start gap-3 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                    }`}
                  >
                    {/* Hospital Icon Box */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-sky-50 border border-sky-100 text-sky-600'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className={`text-xs sm:text-sm font-bold transition-colors truncate ${
                          isSelected ? 'text-blue-900 font-extrabold' : 'text-slate-900 group-hover:text-blue-600'
                        }`}>
                          {hosp.name}
                        </h3>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Open 24x7
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 font-medium text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {hosp.distanceKm} km
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-bold text-[10px] border border-red-100">
                          Emergency
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-100">
                          ICU
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-100">
                          Oxygen
                        </span>
                        {hosp.capabilities.includes('Cath Lab (Interventional Cardiology)') && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-100">
                            Cardiology
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Blood Bank View */}
          {activeTab === 'blood_bank' && (
            <div className="space-y-2">
              {bloodBanks.map((bb) => (
                <div key={bb.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{bb.name}</h4>
                        <p className="text-[11px] text-slate-500">{bb.distanceKm} km • {bb.etaMinutes} min ETA</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${bb.contact}`}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pharmacy View */}
          {activeTab === 'pharmacy' && (
            <div className="space-y-2">
              {pharmacies.map((pharm) => (
                <div key={pharm.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{pharm.name}</h4>
                        <p className="text-[11px] text-slate-500">{pharm.distanceKm} km • 24x7</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${pharm.contact}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={handleProceed}
        nextLabel="Proceed to Facility Details →"
        stepInfo={{
          current: 4,
          total: 8,
          title: 'Facility Selection',
        }}
        emergencyAction={{
          label: 'Call 108',
          onEmergencyCall: () => {
            SoundFX.codeBlueAlarm();
            window.open('tel:108', '_self');
          },
        }}
      />
    </div>
  );
};
