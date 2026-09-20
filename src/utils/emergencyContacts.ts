import { EmergencyContact } from '../types';

export const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact-108',
    name: 'National Ambulance Service (108)',
    phone: '108',
    relation: 'Ambulance',
    isPrimary: true,
    notes: '24x7 Free Govt Emergency Medical Ambulance Fleet',
    notifySms: true,
  },
  {
    id: 'contact-112',
    name: 'Unified Police & Disaster SOS (112)',
    phone: '112',
    relation: 'Police',
    isPrimary: false,
    notes: 'All-India National Emergency First Responders',
    notifySms: true,
  },
  {
    id: 'contact-family-1',
    name: 'Papa (Emergency Family Contact)',
    phone: '+91 98450 12345',
    relation: 'Father',
    isPrimary: false,
    notes: 'Primary next-of-kin emergency contact',
    notifySms: true,
  },
  {
    id: 'contact-doc-1',
    name: 'Dr. Ramesh Sharma (Family Physician)',
    phone: '+91 98201 55432',
    relation: 'Doctor',
    isPrimary: false,
    notes: 'Senior Consultant Physician & Cardiologist',
    notifySms: true,
  },
];

const STORAGE_KEY = 'carebridge_emergency_contacts';
const AUTO_CALL_KEY = 'carebridge_auto_call_enabled';

export function getStoredEmergencyContacts(): EmergencyContact[] {
  if (typeof window === 'undefined') return DEFAULT_EMERGENCY_CONTACTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EMERGENCY_CONTACTS));
      return DEFAULT_EMERGENCY_CONTACTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse emergency contacts from localStorage', err);
  }
  return DEFAULT_EMERGENCY_CONTACTS;
}

export function saveEmergencyContacts(contacts: EmergencyContact[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    window.dispatchEvent(new CustomEvent('carebridge:emergency_contacts_updated', { detail: contacts }));
  } catch (err) {
    console.error('Failed to save emergency contacts to localStorage', err);
  }
}

export function getPrimaryEmergencyContact(contacts?: EmergencyContact[]): EmergencyContact {
  const list = contacts || getStoredEmergencyContacts();
  const found = list.find((c) => c.isPrimary);
  return found || list[0] || DEFAULT_EMERGENCY_CONTACTS[0];
}

export function setPrimaryContact(contactId: string): EmergencyContact[] {
  const list = getStoredEmergencyContacts();
  const updated = list.map((c) => ({
    ...c,
    isPrimary: c.id === contactId,
  }));
  saveEmergencyContacts(updated);
  return updated;
}

export function addEmergencyContact(newContact: Omit<EmergencyContact, 'id'>): EmergencyContact[] {
  const list = getStoredEmergencyContacts();
  const id = `contact-${Date.now()}`;
  const contact: EmergencyContact = { ...newContact, id };

  let updated = [...list];
  if (contact.isPrimary) {
    updated = updated.map((c) => ({ ...c, isPrimary: false }));
    updated.unshift(contact);
  } else {
    // If no primary exists, make this primary
    if (!updated.some((c) => c.isPrimary)) {
      contact.isPrimary = true;
    }
    updated.push(contact);
  }

  saveEmergencyContacts(updated);
  return updated;
}

export function removeEmergencyContact(contactId: string): EmergencyContact[] {
  const list = getStoredEmergencyContacts();
  let updated = list.filter((c) => c.id !== contactId);
  if (updated.length > 0 && !updated.some((c) => c.isPrimary)) {
    updated[0].isPrimary = true;
  }
  saveEmergencyContacts(updated);
  return updated;
}

export function updateEmergencyContact(contact: EmergencyContact): EmergencyContact[] {
  const list = getStoredEmergencyContacts();
  let updated = list.map((c) => (c.id === contact.id ? contact : c));
  if (contact.isPrimary) {
    updated = updated.map((c) => ({
      ...c,
      isPrimary: c.id === contact.id,
    }));
  }
  saveEmergencyContacts(updated);
  return updated;
}

export function getAutoCallPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(AUTO_CALL_KEY);
    return raw !== null ? raw === 'true' : true; // default true
  } catch {
    return true;
  }
}

export function setAutoCallPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_CALL_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('carebridge:auto_call_toggled', { detail: enabled }));
  } catch {}
}

export function cleanPhoneForDial(phone: string): string {
  // Keep only digits, plus, and hash
  return phone.replace(/[^\d+]/g, '');
}

export function dialPhoneNumber(phone: string): void {
  const clean = cleanPhoneForDial(phone);
  if (!clean) return;
  try {
    window.location.href = `tel:${clean}`;
  } catch (e) {
    console.warn('Could not auto-trigger tel: link', e);
  }
}
