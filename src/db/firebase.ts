import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { TourBooking } from '../types.js';
import {
  initialUsers,
  initialGuides,
  initialKYCQueue,
  initialTourPackages,
  initialTravelerPosts,
  initialNegotiationOffers,
  initialTourBookings,
  initialChatMessages
} from './seeds.js';

let db: Firestore | null = null;
let isFirestoreConnected = false;

// Memory Fallback Arrays
const memoryUsers = [...initialUsers];
const memoryGuides = [...initialGuides];
const memoryKYC = [...initialKYCQueue];
const memoryTours = [...initialTourPackages];
const memoryPosts = [...initialTravelerPosts];
const memoryNegotiations = [...initialNegotiationOffers];
const memoryBookings = [...initialTourBookings];
const memoryChat = [...initialChatMessages];

export async function initFirebaseDatabase() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!getApps().length) {
      if (serviceAccountVar) {
        try {
          const serviceAccount = JSON.parse(serviceAccountVar);
          initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || projectId
          });
        } catch (e) {
          initializeApp({ projectId });
        }
      } else if (projectId) {
        initializeApp({ projectId });
      } else {
        initializeApp();
      }
    }

    db = getFirestore();
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch (e) {
      // Ignore if settings already initialized
    }

    // Helper to sanitize documents before Firestore writes
    // Test write & read to verify permissions
    await db.collection('_healthcheck').doc('ping').set({ timestamp: new Date().toISOString() });
    isFirestoreConnected = true;
    console.log('🔥 Connected to Firebase Firestore database!');

    await seedFirebaseIfEmpty();
  } catch (err: any) {
    db = null;
    isFirestoreConnected = false;
    console.warn('🔥 Firebase Firestore auto-connect notice:', err.message || err);
    console.warn('⚡ Using high-speed in-memory store as seamless fallback.');
  }
}

export function isFirebaseConnected(): boolean {
  return isFirestoreConnected && db !== null;
}

export function getDb(): Firestore | null {
  return isFirestoreConnected ? db : null;
}

export async function dbResetAndReseedDatabase() {
  console.log('🧹 Cleaning up database collections and re-inserting clean seed data...');
  
  // 1. Reset in-memory store
  memoryUsers.length = 0;
  memoryUsers.push(...initialUsers);

  memoryGuides.length = 0;
  memoryGuides.push(...initialGuides);

  memoryKYC.length = 0;
  memoryKYC.push(...initialKYCQueue);

  memoryTours.length = 0;
  memoryTours.push(...initialTourPackages);

  memoryPosts.length = 0;
  memoryPosts.push(...initialTravelerPosts);

  memoryNegotiations.length = 0;
  memoryNegotiations.push(...initialNegotiationOffers);

  memoryBookings.length = 0;
  memoryBookings.push(...initialTourBookings);

  memoryChat.length = 0;
  memoryChat.push(...initialChatMessages);

  // 2. If Firestore is active, delete existing dirty records and write clean seeds
  if (db) {
    try {
      const collectionsToClean = ['users', 'guides', 'kyc', 'tours', 'posts', 'negotiations', 'bookings', 'chat'];
      for (const colName of collectionsToClean) {
        const snap = await db.collection(colName).get();
        if (!snap.empty) {
          const deleteBatch = db.batch();
          snap.docs.forEach(doc => deleteBatch.delete(doc.ref));
          await deleteBatch.commit();
        }
      }

      // Re-seed all collections
      const collectionsToSeed = [
        { name: 'users', data: initialUsers },
        { name: 'guides', data: initialGuides },
        { name: 'kyc', data: initialKYCQueue },
        { name: 'tours', data: initialTourPackages },
        { name: 'posts', data: initialTravelerPosts },
        { name: 'negotiations', data: initialNegotiationOffers },
        { name: 'bookings', data: initialTourBookings },
        { name: 'chat', data: initialChatMessages }
      ];

      for (const col of collectionsToSeed) {
        if (col.data && col.data.length > 0) {
          const seedBatch = db.batch();
          for (const item of col.data) {
            seedBatch.set(db.collection(col.name).doc((item as any).id), item);
          }
          await seedBatch.commit();
        }
      }
      console.log('✅ Firestore database successfully wiped clean and seeded with pristine data!');
    } catch (err) {
      console.error('Error during Firestore database reset & reseed:', err);
    }
  }

  return { success: true, message: 'Database wiped and clean seed data inserted successfully' };
}

async function seedFirebaseIfEmpty() {
  if (!db) return;
  try {
    console.log('🌱 Checking Firestore collections and seeding if empty...');
    const collectionsToSeed = [
      { name: 'users', data: initialUsers },
      { name: 'guides', data: initialGuides },
      { name: 'kyc', data: initialKYCQueue },
      { name: 'tours', data: initialTourPackages },
      { name: 'posts', data: initialTravelerPosts },
      { name: 'negotiations', data: initialNegotiationOffers },
      { name: 'bookings', data: initialTourBookings },
      { name: 'chat', data: initialChatMessages }
    ];

    for (const col of collectionsToSeed) {
      const snap = await db.collection(col.name).limit(1).get();
      if (snap.empty && col.data && col.data.length > 0) {
        console.log(`Seeding ${col.data.length} items into Firestore collection '${col.name}'...`);
        const batch = db.batch();
        for (const item of col.data) {
          batch.set(db.collection(col.name).doc((item as any).id), item);
        }
        await batch.commit();
      }
    }
    console.log('✅ Firebase Firestore collection checks and seeding complete!');
  } catch (err) {
    console.warn('Firebase seeding warning:', err);
  }
}

// ==================== DATABASE HELPERS (FIRESTORE PRIMARY + MEMORY FALLBACK) ====================

// User Email Aliases mapping for demo convenience
const DEMO_EMAIL_ALIASES: Record<string, string> = {
  'sarah@example.com': 'sarah.j@example.com',
  'sarah.jenkins@example.com': 'sarah.j@example.com',
  'alex@example.com': 'alex.j@example.com',
  'alex.johnson@example.com': 'alex.j@example.com',
  'minh.tourguide@gmail.com': 'minh.guide@example.com',
  'minh@example.com': 'minh.guide@example.com',
  'minh.nguyen@example.com': 'minh.guide@example.com',
  'linh@example.com': 'linh.saigon@example.com',
  'linh.tran@example.com': 'linh.saigon@example.com',
  'duc@example.com': 'duc.hanoi@example.com',
  'duc.pham@example.com': 'duc.hanoi@example.com',
  'mai@example.com': 'mai.danang@example.com',
  'mai.le@example.com': 'mai.danang@example.com',
  'somchai@example.com': 'hoangnam@example.com',
  'nam@example.com': 'hoangnam@example.com',
  'hoang.nam@example.com': 'hoangnam@example.com',
  'alexander@tourguidehub.com': 'admin@tourguidehub.com',
  'alexander.wright@tourguidehub.com': 'admin@tourguidehub.com'
};

// User
export async function dbFindUserByEmail(email: string) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const canonicalEmail = DEMO_EMAIL_ALIASES[cleanEmail] || cleanEmail;

  if (db) {
    try {
      let snap = await db.collection('users').where('email', '==', canonicalEmail).limit(1).get();
      if (!snap.empty) return snap.docs[0].data();
      if (canonicalEmail !== cleanEmail) {
        snap = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
        if (!snap.empty) return snap.docs[0].data();
      }
    } catch (e) {}
  }
  return memoryUsers.find(u => {
    const uEmail = u.email.toLowerCase();
    return uEmail === canonicalEmail || uEmail === cleanEmail;
  }) || null;
}

export async function dbFindUserById(id: string) {
  if (db) {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (doc.exists) return doc.data();
    } catch (e) {}
  }
  return memoryUsers.find(u => u.id === id) || null;
}

export async function dbFindUserByToken(token: string) {
  if (!token) return null;
  if (db) {
    try {
      const snap = await db.collection('users').where('token', '==', token).limit(1).get();
      if (!snap.empty) return snap.docs[0].data();
    } catch (e) {}
  }
  return memoryUsers.find(u => u.token === token) || null;
}

export async function dbSaveUser(userData: any) {
  if (!userData.createdAt) userData.createdAt = new Date().toISOString();
  if (db) {
    try {
      await db.collection('users').doc(userData.id).set(userData, { merge: true });
    } catch (e) {}
  }
  const idx = memoryUsers.findIndex(u => u.id === userData.id);
  if (idx >= 0) memoryUsers[idx] = { ...memoryUsers[idx], ...userData };
  else memoryUsers.unshift(userData);
  return userData;
}

export async function dbGetAllUsers() {
  if (db) {
    try {
      const snap = await db.collection('users').get();
      return snap.docs.map(doc => doc.data());
    } catch (e) {
      console.error('dbGetAllUsers error:', e);
    }
  }
  return memoryUsers;
}

// Guide
export async function dbFindGuideByUserIdOrName(userId: string, name?: string) {
  if (db) {
    try {
      const snap = await db.collection('guides').where('userId', '==', userId).limit(1).get();
      if (!snap.empty) return snap.docs[0].data();
      if (name) {
        const nameSnap = await db.collection('guides').where('fullName', '==', name).limit(1).get();
        if (!nameSnap.empty) return nameSnap.docs[0].data();
      }
    } catch (e) {
      console.error('dbFindGuideByUserIdOrName error:', e);
    }
  }
  return memoryGuides.find(g => g.userId === userId || (name && g.fullName === name)) || null;
}

export async function dbFindGuideById(id: string) {
  if (db) {
    try {
      const doc = await db.collection('guides').doc(id).get();
      if (doc.exists) return doc.data();
    } catch (e) {
      console.error('dbFindGuideById error:', e);
    }
  }
  return memoryGuides.find(g => g.id === id) || null;
}

function sanitizeDoc(obj: any): any {
  if (obj === undefined || obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeDoc(item));
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeDoc(value);
    }
  }
  return clean;
}

export async function dbSaveGuide(guideData: any) {
  if (db) {
    try {
      await db.collection('guides').doc(guideData.id).set(sanitizeDoc(guideData), { merge: true });
    } catch (e) {
      console.error('dbSaveGuide error:', e);
    }
  }
  const idx = memoryGuides.findIndex(g => g.id === guideData.id);
  if (idx >= 0) memoryGuides[idx] = { ...memoryGuides[idx], ...guideData };
  else memoryGuides.unshift(guideData);
  return guideData;
}

export async function dbGetGuides(city?: string, verifiedOnly?: boolean) {
  if (db) {
    try {
      let ref: any = db.collection('guides');
      if (city && city !== 'All') ref = ref.where('city', '==', city);
      if (verifiedOnly) ref = ref.where('verified', '==', true);
      const snap = await ref.get();
      return snap.docs.map((doc: any) => doc.data());
    } catch (e) {
      console.error('dbGetGuides error:', e);
    }
  }
  return memoryGuides.filter(g => {
    if (city && city !== 'All' && g.city.toLowerCase() !== city.toLowerCase()) return false;
    if (verifiedOnly && !g.verified && g.kycStatus !== 'verified') return false;
    return true;
  });
}

export async function dbGetOnlineGuide() {
  if (db) {
    try {
      const snap = await db.collection('guides').where('isOnline', '==', true).limit(1).get();
      if (!snap.empty) return snap.docs[0].data();
      const allSnap = await db.collection('guides').limit(1).get();
      if (!allSnap.empty) return allSnap.docs[0].data();
    } catch (e) {
      console.error('dbGetOnlineGuide error:', e);
    }
  }
  return memoryGuides.find(g => g.isOnline) || memoryGuides[0] || null;
}

// KYC
export async function dbSaveKYC(kycData: any) {
  if (db) {
    try {
      await db.collection('kyc').doc(kycData.id).set(sanitizeDoc(kycData), { merge: true });
    } catch (e) {
      console.error('dbSaveKYC error:', e);
    }
  }
  const idx = memoryKYC.findIndex(k => k.id === kycData.id);
  if (idx >= 0) memoryKYC[idx] = { ...memoryKYC[idx], ...kycData };
  else memoryKYC.unshift(kycData);
  return kycData;
}

export async function dbGetKYCList() {
  if (db) {
    try {
      const snap = await db.collection('kyc').get();
      return snap.docs.map(doc => doc.data());
    } catch (e) {
      console.error('dbGetKYCList error:', e);
    }
  }
  return memoryKYC;
}

export async function dbFindKYCById(id: string) {
  if (db) {
    try {
      const doc = await db.collection('kyc').doc(id).get();
      if (doc.exists) return doc.data();
    } catch (e) {
      console.error('dbFindKYCById error:', e);
    }
  }
  return memoryKYC.find(k => k.id === id) || null;
}

// Tours
export async function dbSaveTour(tourData: any) {
  if (db) {
    try {
      await db.collection('tours').doc(tourData.id).set(sanitizeDoc(tourData), { merge: true });
    } catch (e) {
      console.error('dbSaveTour error:', e);
    }
  }
  const idx = memoryTours.findIndex(t => t.id === tourData.id);
  if (idx >= 0) memoryTours[idx] = { ...memoryTours[idx], ...tourData };
  else memoryTours.unshift(tourData);
  return tourData;
}

export async function dbGetTours(city?: string) {
  if (db) {
    try {
      let ref: any = db.collection('tours');
      if (city && city !== 'All') ref = ref.where('city', '==', city);
      const snap = await ref.get();
      return snap.docs.map((doc: any) => doc.data());
    } catch (e) {
      console.error('dbGetTours error:', e);
    }
  }
  return memoryTours.filter(t => {
    if (city && city !== 'All' && t.city.toLowerCase() !== city.toLowerCase()) return false;
    return true;
  });
}

export async function dbFindTourById(id: string) {
  if (db) {
    try {
      const doc = await db.collection('tours').doc(id).get();
      if (doc.exists) return doc.data();
    } catch (e) {
      console.error('dbFindTourById error:', e);
    }
  }
  return memoryTours.find(t => t.id === id) || null;
}

// Posts
export async function dbSavePost(postData: any) {
  if (db) {
    try {
      await db.collection('posts').doc(postData.id).set(sanitizeDoc(postData), { merge: true });
    } catch (e) {
      console.error('dbSavePost error:', e);
    }
  }
  const idx = memoryPosts.findIndex(p => p.id === postData.id);
  if (idx >= 0) memoryPosts[idx] = { ...memoryPosts[idx], ...postData };
  else memoryPosts.unshift(postData);
  return postData;
}

export async function dbGetPosts(city?: string, status?: string) {
  if (db) {
    try {
      let ref: any = db.collection('posts');
      if (city && city !== 'All') ref = ref.where('city', '==', city);
      if (status) ref = ref.where('status', '==', status);
      const snap = await ref.get();
      return snap.docs.map((doc: any) => doc.data());
    } catch (e) {
      console.error('dbGetPosts error:', e);
    }
  }
  return memoryPosts.filter(p => {
    if (city && city !== 'All' && p.city.toLowerCase() !== city.toLowerCase()) return false;
    if (status && p.status !== status) return false;
    return true;
  });
}

export async function dbFindPostById(id: string) {
  if (db) {
    try {
      const doc = await db.collection('posts').doc(id).get();
      if (doc.exists) return doc.data();
    } catch (e) {
      console.error('dbFindPostById error:', e);
    }
  }
  return memoryPosts.find(p => p.id === id) || null;
}

// Negotiations
export async function dbSaveNegotiation(negData: any) {
  if (db) {
    try {
      await db.collection('negotiations').doc(negData.id).set(sanitizeDoc(negData), { merge: true });
    } catch (e) {
      console.error('dbSaveNegotiation error:', e);
    }
  }
  const idx = memoryNegotiations.findIndex(n => n.id === negData.id);
  if (idx >= 0) memoryNegotiations[idx] = { ...memoryNegotiations[idx], ...negData };
  else memoryNegotiations.unshift(negData);
  return negData;
}

export async function dbFindNegotiationByPostAndGuide(postId: string, guideId: string) {
  if (db) {
    try {
      const snap = await db.collection('negotiations').where('postId', '==', postId).where('guideId', '==', guideId).limit(1).get();
      if (!snap.empty) return snap.docs[0].data();
    } catch (e) {
      console.error('dbFindNegotiationByPostAndGuide error:', e);
    }
  }
  return memoryNegotiations.find(n => n.postId === postId && n.guideId === guideId) || null;
}

// Helper to sanitize search tokens for Firestore query
export async function dbFindNegotiationById(id: string) {
  if (db) {
    try {
      const doc = await db.collection('negotiations').doc(id).get();
      if (doc.exists) return doc.data();
    } catch (e) {
      console.error('dbFindNegotiationById error:', e);
    }
  }
  return memoryNegotiations.find(n => n.id === id) || null;
}

export async function dbGetNegotiationsByUser(userId: string) {
  if (db) {
    try {
      if (userId === 'all') {
        const snap = await db.collection('negotiations').get();
        return snap.docs.map(doc => doc.data());
      } else {
        const snap1 = await db.collection('negotiations').where('travelerId', '==', userId).get();
        const snap2 = await db.collection('negotiations').where('guideId', '==', userId).get();
        const map = new Map<string, any>();
        snap1.docs.forEach(doc => map.set(doc.id, doc.data()));
        snap2.docs.forEach(doc => map.set(doc.id, doc.data()));
        return Array.from(map.values());
      }
    } catch (e) {
      console.error('dbGetNegotiationsByUser error:', e);
    }
  }
  return memoryNegotiations.filter(n => userId === 'all' || n.travelerId === userId || n.guideId === userId);
}

// Bookings
export async function dbSaveBooking(bookingData: any) {
  if (!bookingData || !bookingData.id) {
    console.error('dbSaveBooking error: bookingData missing id', bookingData);
    return bookingData;
  }
  const cleanData = sanitizeDoc(bookingData);
  const idx = memoryBookings.findIndex(b => b.id === bookingData.id);
  if (idx >= 0) memoryBookings[idx] = { ...memoryBookings[idx], ...cleanData };
  else memoryBookings.unshift(cleanData);

  if (db) {
    try {
      await db.collection('bookings').doc(bookingData.id).set(cleanData, { merge: true });
    } catch (e) {
      console.error('dbSaveBooking error:', e);
    }
  }
  return cleanData;
}

export async function dbFindBookingById(id: string): Promise<TourBooking | null> {
  if (db) {
    try {
      const doc = await db.collection('bookings').doc(id).get();
      if (doc.exists) {
        const data = { id: doc.id, ...doc.data() } as TourBooking;
        const idx = memoryBookings.findIndex(b => b.id === id);
        if (idx >= 0) memoryBookings[idx] = { ...memoryBookings[idx], ...data };
        else memoryBookings.push(data);
        return data;
      }
    } catch (e) {
      console.error('dbFindBookingById error:', e);
    }
  }
  return memoryBookings.find(b => b.id === id) || null;
}

export async function dbGetBookingsByUser(userId: string) {
  if (db) {
    try {
      const map = new Map<string, any>();
      if (userId === 'all') {
        const snap = await db.collection('bookings').get();
        snap.docs.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
      } else {
        const snap1 = await db.collection('bookings').where('travelerId', '==', userId).get();
        const snap2 = await db.collection('bookings').where('guideId', '==', userId).get();
        snap1.docs.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
        snap2.docs.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
      }
      // Update memory cache from Firestore results
      map.forEach((val, id) => {
        const idx = memoryBookings.findIndex(b => b.id === id);
        if (idx >= 0) memoryBookings[idx] = { ...memoryBookings[idx], ...val };
        else memoryBookings.push(val);
      });
      // Also return any in-memory bookings not yet indexed in Firestore
      memoryBookings.filter(b => userId === 'all' || b.travelerId === userId || b.guideId === userId).forEach(b => {
        if (!map.has(b.id)) {
          map.set(b.id, b);
        }
      });
      return Array.from(map.values());
    } catch (e) {
      console.error('dbGetBookingsByUser error:', e);
    }
  }
  return memoryBookings.filter(b => userId === 'all' || b.travelerId === userId || b.guideId === userId);
}

export async function dbGetAllBookings() {
  if (db) {
    try {
      const map = new Map<string, any>();
      const snap = await db.collection('bookings').get();
      snap.docs.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
      map.forEach((val, id) => {
        const idx = memoryBookings.findIndex(b => b.id === id);
        if (idx >= 0) memoryBookings[idx] = { ...memoryBookings[idx], ...val };
        else memoryBookings.push(val);
      });
      memoryBookings.forEach(b => {
        if (!map.has(b.id)) {
          map.set(b.id, b);
        }
      });
      return Array.from(map.values());
    } catch (e) {
      console.error('dbGetAllBookings error:', e);
    }
  }
  return memoryBookings;
}

// Chat
export async function dbGetChatMessages(bookingId: string) {
  if (db) {
    try {
      const snap = await db.collection('chat').where('bookingId', '==', bookingId).get();
      return snap.docs.map(doc => doc.data()).sort((a: any, b: any) => (a.timestamp > b.timestamp ? 1 : -1));
    } catch (e) {
      console.error('dbGetChatMessages error:', e);
    }
  }
  return memoryChat.filter(c => c.bookingId === bookingId).sort((a: any, b: any) => (a.timestamp > b.timestamp ? 1 : -1));
}

export async function dbSaveChatMessage(msgData: any) {
  if (db) {
    try {
      await db.collection('chat').doc(msgData.id).set(msgData, { merge: true });
    } catch (e) {}
  }
  const idx = memoryChat.findIndex(c => c.id === msgData.id);
  if (idx >= 0) memoryChat[idx] = { ...memoryChat[idx], ...msgData };
  else memoryChat.push(msgData);
  return msgData;
}

// Aliases for fs* functions
export const fsFindUserByEmail = dbFindUserByEmail;
export const fsFindUserById = dbFindUserById;
export const fsFindUserByToken = dbFindUserByToken;
export const fsSaveUser = dbSaveUser;
export const fsGetAllUsers = dbGetAllUsers;
export const fsFindGuideByUserIdOrName = dbFindGuideByUserIdOrName;
export const fsFindGuideById = dbFindGuideById;
export const fsSaveGuide = dbSaveGuide;
export const fsGetGuides = dbGetGuides;
export const fsGetOnlineGuide = dbGetOnlineGuide;
export const fsSaveKYC = dbSaveKYC;
export const fsGetKYCList = dbGetKYCList;
export const fsFindKYCById = dbFindKYCById;
export const fsSaveTour = dbSaveTour;
export const fsGetTours = dbGetTours;
export const fsFindTourById = dbFindTourById;
export const fsSavePost = dbSavePost;
export const fsGetPosts = dbGetPosts;
export const fsFindPostById = dbFindPostById;
export const fsSaveNegotiation = dbSaveNegotiation;
export const fsFindNegotiationByPostAndGuide = dbFindNegotiationByPostAndGuide;
export const fsFindNegotiationById = dbFindNegotiationById;
export const fsGetNegotiationsByUser = dbGetNegotiationsByUser;
export const fsSaveBooking = dbSaveBooking;
export const fsFindBookingById = dbFindBookingById;
export const fsGetBookingsByUser = dbGetBookingsByUser;
export const fsGetAllBookings = dbGetAllBookings;
export const fsGetChatMessages = dbGetChatMessages;
export const fsSaveChatMessage = dbSaveChatMessage;
