import React, { useState, useEffect } from 'react';
import { EmergencyContact, EmergencyRelation } from '../../types';
import {
  getStoredEmergencyContacts,
  saveEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  setPrimaryContact,
  updateEmergencyContact,
  getAutoCallPreference,
  setAutoCallPreference,
  dialPhoneNumber,
} from '../../utils/emergencyContacts';
import { SoundFX } from '../../utils/speech';
import {
  PhoneCall,
  UserPlus,
  Trash2,
  Star,
  Check,
  X,
  AlertCircle,
  ShieldAlert,
  Zap,
  Phone,
  HeartPulse,
  UserCheck,
  Edit2,
} from 'lucide-react';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSosCall?: (contact: EmergencyContact) => void;
}

const RELATION_OPTIONS: { value: EmergencyRelation; label: string; icon: string }[] = [
  { value: 'Ambulance', label: 'Ambulance Fleet', icon: '🚑' },
  { value: 'Police', label: 'Police / First Responder', icon: '🚓' },
  { value: 'Father', label: 'Father / Dad', icon: '👨' },
  { value: 'Mother', label: 'Mother / Mom', icon: '👩' },
  { value: 'Spouse', label: 'Spouse / Partner', icon: '💍' },
  { value: 'Child', label: 'Son / Daughter', icon: '🧒' },
  { value: 'Doctor', label: 'Personal Doctor / Physician', icon: '🩺' },
  { value: 'Caregiver', label: 'Caregiver / Nurse', icon: '🏥' },
  { value: 'Neighbor', label: 'Neighbor / Colleague', icon: '🤝' },
  { value: 'Family', label: 'Other Family Member', icon: '👨‍👩‍👧' },
  { value: 'Other', label: 'Other Contact', icon: '📞' },
];

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose,
  onTriggerSosCall,
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [autoCallEnabled, setAutoCallEnabledState] = useState<boolean>(true);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRelation, setFormRelation] = useState<EmergencyRelation>('Family');
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadContacts = () => {
    setContacts(getStoredEmergencyContacts());
    setAutoCallEnabledState(getAutoCallPreference());
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      setIsAddingNew(false);
      setEditingContactId(null);
      resetForm();
    }
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast((current) => (current === msg ? null : current));
    }, 3000);
  };

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormRelation('Family');
    setFormIsPrimary(false);
    setFormNotes('');
    setFormError(null);
  };

  const handleToggleAutoCall = (enabled: boolean) => {
    setAutoCallPreference(enabled);
    setAutoCallEnabledState(enabled);
    SoundFX.tapTick();
    showNotification(
      enabled
        ? '⚡ Auto-call enabled: Clicking the Emergency icon will immediately dial your primary contact.'
        : 'Auto-call paused: Clicking the Emergency icon will prompt confirmation before dialing.'
    );
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    const trimmedPhone = formPhone.trim();

    if (!trimmedName) {
      setFormError('Please provide a name or title for this emergency contact.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 3) {
      setFormError('Please enter a valid emergency phone number.');
      return;
    }

    if (editingContactId) {
      const updatedList = updateEmergencyContact({
        id: editingContactId,
        name: trimmedName,
        phone: trimmedPhone,
        relation: formRelation,
        isPrimary: formIsPrimary,
        notes: formNotes.trim() || undefined,
        notifySms: true,
      });
      setContacts(updatedList);
      setEditingContactId(null);
      resetForm();
      SoundFX.cardiacPulse();
      showNotification(`✓ Updated emergency contact "${trimmedName}"`);
    } else {
      const updatedList = addEmergencyContact({
        name: trimmedName,
        phone: trimmedPhone,
        relation: formRelation,
        isPrimary: formIsPrimary,
        notes: formNotes.trim() || undefined,
        notifySms: true,
      });
      setContacts(updatedList);
      setIsAddingNew(false);
      resetForm();
      SoundFX.cardiacPulse();
      showNotification(`✓ Added new emergency contact "${trimmedName}"`);
    }
  };

  const handleStartEdit = (contact: EmergencyContact) => {
    setEditingContactId(contact.id);
    setIsAddingNew(false);
    setFormName(contact.name);
    setFormPhone(contact.phone);
    setFormRelation(contact.relation);
    setFormIsPrimary(contact.isPrimary);
    setFormNotes(contact.notes || '');
    setFormError(null);
  };

  const handleDelete = (contact: EmergencyContact) => {
    if (contacts.length <= 1) {
      showNotification('At least one emergency number must be kept for safety.');
      return;
    }
    const updated = removeEmergencyContact(contact.id);
    setContacts(updated);
    SoundFX.tapTick();
    showNotification(`Removed ${contact.name}`);
  };

  const handleSetPrimary = (contactId: string) => {
    const updated = setPrimaryContact(contactId);
    setContacts(updated);
    SoundFX.cardiacPulse();
    const primary = updated.find((c) => c.id === contactId);
    showNotification(`⭐ Set "${primary?.name}" as Primary Auto-Call Contact`);
  };

  const handleQuickAddPreset = (name: string, phone: string, relation: EmergencyRelation) => {
    const updated = addEmergencyContact({
      name,
      phone,
      relation,
      isPrimary: false,
      notes: `Quick-added ${relation}`,
      notifySms: true,
    });
    setContacts(updated);
    SoundFX.cardiacPulse();
    showNotification(`✓ Added "${name}" (${phone}) to emergency list`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-tactical-red/40 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-hud font-bold text-base sm:text-lg text-white tracking-wide">
                  Emergency Numbers &amp; Auto-Call
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-bold">
                  {contacts.length} Numbers
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Add emergency numbers. Clicking the Emergency icon auto-calls your primary contact.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Notification Toast */}
          {successToast && (
            <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Auto-Call Toggle Banner */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${autoCallEnabled ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-500'}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white">Auto-Call on Emergency Icon Click</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${autoCallEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {autoCallEnabled ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {autoCallEnabled
                    ? 'Tapping any Emergency / SOS button immediately triggers a direct phone call to your Primary contact.'
                    : 'Emergency button opens the emergency dialer menu without initiating an automatic phone call.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="toggle-auto-call-btn"
              onClick={() => handleToggleAutoCall(!autoCallEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all shrink-0 ${
                autoCallEnabled
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {autoCallEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Primary Auto-Call Highlight Card */}
          {(() => {
            const primary = contacts.find((c) => c.isPrimary) || contacts[0];
            if (!primary) return null;
            return (
              <div className="bg-gradient-to-r from-red-950/60 to-slate-900 border-2 border-red-500/60 rounded-2xl p-4 relative overflow-hidden shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        PRIMARY AUTO-CALL NUMBER
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({primary.relation})</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white">{primary.name}</h4>
                    <p className="text-xs sm:text-sm font-mono font-bold text-red-400 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{primary.phone}</span>
                    </p>
                    {primary.notes && <p className="text-[11px] text-slate-400 mt-1">{primary.notes}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      id="test-dial-primary-btn"
                      onClick={() => {
                        SoundFX.codeBlueAlarm();
                        if (onTriggerSosCall) {
                          onTriggerSosCall(primary);
                        } else {
                          dialPhoneNumber(primary.phone);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/60 transition-transform active:scale-95"
                    >
                      <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                      <span>Direct Dial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(primary)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1 border border-slate-700"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Contact Addition / Editing Form */}
          {(isAddingNew || editingContactId) && (
            <form
              onSubmit={handleSaveContact}
              className="bg-slate-950 border border-slate-700 rounded-2xl p-4 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-red-400" />
                  <span>{editingContactId ? 'Edit Emergency Contact' : 'Add New Emergency Number'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingContactId(null);
                    resetForm();
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-2 rounded-lg bg-red-950/80 border border-red-600/60 text-red-200 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Contact Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mom, Dr. Sharma, Father"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Emergency Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210 or 108"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Relationship / Role
                  </label>
                  <select
                    value={formRelation}
                    onChange={(e) => setFormRelation(e.target.value as EmergencyRelation)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    {RELATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Speaks Hindi, Lives next door"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primary-checkbox"
                  checked={formIsPrimary}
                  onChange={(e) => setFormIsPrimary(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-red-600 focus:ring-0"
                />
                <label htmlFor="primary-checkbox" className="text-xs text-slate-300 cursor-pointer font-medium">
                  Set as <strong className="text-amber-300">Primary Auto-Call Contact</strong> (Called first when emergency icon is clicked)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingContactId(null);
                    resetForm();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-emergency-contact-btn"
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md"
                >
                  {editingContactId ? 'Update Contact' : 'Save Emergency Contact'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Preset Add Pills */}
          {!isAddingNew && !editingContactId && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Quick-Add Emergency Preset:
                </span>
                <button
                  type="button"
                  id="btn-open-custom-contact-form"
                  onClick={() => {
                    resetForm();
                    setIsAddingNew(true);
                  }}
                  className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 font-mono"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Custom Number</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAddPreset('Mummy (Mom)', '+91 98111 22334', 'Mother')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <span>👩 + Mom</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddPreset('Dr. Verma (Cardiologist)', '+91 98333 44556', 'Doctor')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <span>🩺 + Personal Doctor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddPreset('Neighbor (Rakesh)', '+91 98777 88990', 'Neighbor')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <span>🤝 + Neighbor First Responder</span>
                </button>
              </div>
            </div>
          )}

          {/* All Configured Emergency Numbers List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block">
              Configured Emergency Numbers ({contacts.length}):
            </span>

            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    contact.isPrimary
                      ? 'bg-red-950/30 border-red-500/50 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        contact.isPrimary
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {contact.relation === 'Ambulance'
                        ? '🚑'
                        : contact.relation === 'Police'
                        ? '🚓'
                        : contact.relation === 'Doctor'
                        ? '🩺'
                        : contact.relation === 'Father'
                        ? '👨'
                        : contact.relation === 'Mother'
                        ? '👩'
                        : '📞'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            PRIMARY
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">({contact.relation})</span>
                      </div>
                      <p className="text-xs font-mono text-red-400 font-semibold">{contact.phone}</p>
                      {contact.notes && <p className="text-[10px] text-slate-500">{contact.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Direct dial anchor */}
                    <a
                      href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                      onClick={() => SoundFX.codeBlueAlarm()}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white text-slate-200 border border-slate-700 transition-colors"
                      title={`Dial ${contact.name}`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>

                    {!contact.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(contact.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-700 transition-colors"
                        title="Set as Primary Auto-Call Contact"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartEdit(contact)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(contact)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] font-mono">
            Clicking the SOS icon will dial: <strong className="text-amber-400">{contacts.find((c) => c.isPrimary)?.name || contacts[0]?.name || '108'}</strong>
          </span>
          <button
            type="button"
            id="btn-close-contacts-modal"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
