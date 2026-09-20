import React, { useState } from 'react';
import { Hospital } from '../../../types';
import { CheckCircle2, MessageCircle, MapPin, Radio, Share2, ExternalLink, Users } from 'lucide-react';
import { SoundFX } from '../../../utils/speech';
import { StickyBottomActionBar } from '../StickyBottomActionBar';

interface ShareFamilyScreenProps {
  hospital: Hospital;
  onBack: () => void;
  detectedInfo: {
    patient: string;
    symptoms: string[];
  };
}

export const ShareFamilyScreen: React.FC<ShareFamilyScreenProps> = ({
  hospital,
  onBack,
  detectedInfo,
}) => {
  const [sharedAgain, setSharedAgain] = useState(false);

  const messageText = `My father is experiencing breathing difficulty and chest pain. I am taking him to ${hospital.name} (${hospital.distanceKm} km). Please reach out if needed.`;

  const handleShareAgain = () => {
    SoundFX.tapTick();
    const url = `https://wa.me/?text=${encodeURIComponent(`🚨 EMERGENCY UPDATE: ${messageText}\nLive GPS: https://maps.google.com/?q=${hospital.lat},${hospital.lng}`)}`;
    window.open(url, '_blank');
    setSharedAgain(true);
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] animate-in fade-in duration-150 text-left">
      <div className="space-y-3.5 pb-3">
        {/* Top Header without any back arrow button */}
        <div className="pt-2 pb-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Share with Family
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time SMS &amp; WhatsApp status broadcast
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Green Success Banner Card */}
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-900">
              Emergency Broadcast Dispatched
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              Your family contacts have received live GPS tracking and facility details.
            </p>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Message Content Broadcast</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed font-medium">
            &ldquo;{messageText}&rdquo;
          </div>
        </div>

        {/* Location Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs text-xs">
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Destination Facility
            </span>
            <a
              href={`https://maps.google.com/?q=${hospital.lat},${hospital.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>{hospital.name}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              Real-time Live Location
            </span>
            <a
              href={`https://maps.google.com/?q=${hospital.lat},${hospital.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Live Tracking Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Standardized Sticky Bottom Action Area */}
      <StickyBottomActionBar
        onBack={onBack}
        backLabel="Back"
        onNext={handleShareAgain}
        nextLabel="Share with WhatsApp / SMS →"
        stepInfo={{
          current: 8,
          total: 8,
          title: 'Family Sharing',
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
