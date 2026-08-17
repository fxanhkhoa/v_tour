// Google Contacts (People API) & vCard Integration for Travelers and Tour Guides

import { getGoogleAccessToken, requestGoogleContactsPermission } from './firebaseClient';

export interface GuideContactPayload {
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  city?: string;
  role?: string;
  tourTitle?: string;
  bookingId?: string;
  pinCode?: string;
  notes?: string;
}

export interface SaveContactResult {
  success: boolean;
  resourceName?: string;
  contactUrl?: string;
  error?: string;
}

/**
 * Split a full name into First/Given and Last/Family parts for Google People API
 */
export function splitFullName(fullName: string): { givenName: string; familyName: string } {
  const parts = (fullName || 'Local Guide').trim().split(/\s+/);
  if (parts.length === 1) {
    return { givenName: parts[0], familyName: '(Vietnam Tour Guide)' };
  }
  const givenName = parts[0];
  const familyName = parts.slice(1).join(' ') + ' (Tour Guide)';
  return { givenName, familyName };
}

/**
 * Save a tour guide's phone number & info to Google Contacts using the Google People API
 * Scope: https://www.googleapis.com/auth/contacts
 */
export async function saveContactToGooglePeopleApi(
  payload: GuideContactPayload,
  explicitToken?: string
): Promise<SaveContactResult> {
  let token = explicitToken || getGoogleAccessToken();

  // If no token in memory, prompt traveler for Google OAuth permission
  if (!token) {
    token = await requestGoogleContactsPermission();
  }

  if (!token) {
    throw new Error('Google Contacts authentication token is not available.');
  }

  const { givenName, familyName } = splitFullName(payload.name);

  const requestBody: any = {
    names: [
      {
        givenName: givenName,
        familyName: familyName,
        displayName: `${payload.name} (Tour Guide)`
      }
    ],
    phoneNumbers: [
      {
        value: payload.phone || '+84 908 123 456',
        type: 'mobile',
        formattedType: 'Mobile'
      }
    ],
    organizations: [
      {
        name: 'Vietnam Local Tour Guides',
        title: payload.role || 'Licensed Tour Guide',
        department: payload.city ? `${payload.city} Guide Bureau` : 'Local Guides'
      }
    ],
    biographies: [
      {
        value: [
          `🇻🇳 Licensed Tour Guide: ${payload.name}`,
          payload.city ? `📍 Operating City: ${payload.city}` : '',
          payload.tourTitle ? `🗺️ Tour Experience: ${payload.tourTitle}` : '',
          payload.bookingId ? `🔖 Booking Reference: #${payload.bookingId.toUpperCase()}` : '',
          payload.pinCode ? `🛡️ Safety Match PIN: ${payload.pinCode}` : '',
          payload.notes ? `📝 Notes: ${payload.notes}` : '',
          '🛡️ Vietnam Local Tour Guide & Traveler Network'
        ].filter(Boolean).join('\n'),
        contentType: 'TEXT_PLAIN'
      }
    ],
    userDefined: [
      { key: 'Platform', value: 'Vietnam Local Tour Guide Network' },
      { key: 'GuideCity', value: payload.city || 'Vietnam' }
    ]
  };

  if (payload.email) {
    requestBody.emailAddresses = [
      {
        value: payload.email,
        type: 'work',
        formattedType: 'Work'
      }
    ];
  }

  const response = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Google People API createContact failed:', data);
    const errorMessage = data?.error?.message || 'Failed to save contact to Google Contacts.';
    throw new Error(errorMessage);
  }

  // Extract contact identifier or resource name (e.g. people/c1234567890)
  const resourceName = data.resourceName || '';
  const contactId = resourceName.replace('people/', '');
  const contactUrl = contactId ? `https://contacts.google.com/person/${contactId}` : 'https://contacts.google.com';

  return {
    success: true,
    resourceName,
    contactUrl
  };
}

/**
 * Generate standard vCard (.vcf) format for offline address book import
 */
export function generateVCardString(payload: GuideContactPayload): string {
  const cleanPhone = (payload.phone || '+84908123456').replace(/[^\d+]/g, '');
  const { givenName, familyName } = splitFullName(payload.name);

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${familyName};${givenName};;;`,
    `FN:${payload.name} (Tour Guide)`,
    'ORG:Vietnam Local Tour Guides;',
    `TITLE:${payload.role || 'Licensed Tour Guide'}`,
    `TEL;TYPE=CELL,VOICE:${cleanPhone}`,
    payload.email ? `EMAIL;TYPE=WORK,INTERNET:${payload.email}` : '',
    payload.city ? `ADR;TYPE=WORK:;;;${payload.city};;;Vietnam` : '',
    `NOTE:Tour Guide for Vietnam Guided Tour. ${payload.tourTitle ? `Tour: ${payload.tourTitle}.` : ''} ${payload.pinCode ? `Safety PIN: ${payload.pinCode}` : ''}`,
    'CATEGORIES:Tour Guide,Travel,Vietnam',
    'END:VCARD'
  ].filter(Boolean).join('\r\n');
}

/**
 * Download a .vcf vCard file to user device
 */
export function downloadGuideVCard(payload: GuideContactPayload, filename?: string): void {
  const vcfData = generateVCardString(payload);
  const blob = new Blob([vcfData], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (payload.name || 'guide').toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('download', filename || `tour_guide_${safeName}.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Open Google Contacts web interface directly
 */
export function openGoogleContactsWeb(contactUrl?: string): void {
  const url = contactUrl || 'https://contacts.google.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}
