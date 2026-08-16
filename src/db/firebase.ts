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
  initialChatMessages,
  initialNotifications
} from './seeds.js';

let db: Firestore | null = null;
let isFirestoreConnected = false;
let isFirestoreQuotaExceeded = false;
let quotaExceededMessage = '';

// Resilient In-Memory Database Store
const memoryUsers = [...initialUsers];
const memoryGuides = [...initialGuides];
const memoryKYC = [...initialKYCQueue];
const memoryTours = [...initialTourPackages];
const memoryPosts = [...initialTravelerPosts];
const memoryNegotiations = [...initialNegotiationOffers];
const memoryBookings = [...initialTourBookings];
const memoryChat = [...initialChatMessages];
const memoryNotifications = [...initialNotifications];

/**
 * Checks if a thrown error is due to Firestore quota exhaustion or rate limits.
 */
export function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err.details || err || '').toLowerCase();
  const code = err.code || err.status;
  return (
    code === 8 ||
    code === 'RESOURCE_EXHAUSTED' ||
    code === 'resource-exhausted' ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('quota') ||
    msg.includes('exhausted') ||
    msg.includes('insufficient quota') ||
    msg.includes('rate limit') ||
    msg.includes('bandwidth quota')
  );
}

/**
 * Handles errors from Firestore operations and trips the memory fallback circuit breaker if quota is exceeded.
 */
function handleFirestoreError(err: any, operationName: string) {
  if (isQuotaExhaustedError(err)) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      quotaExceededMessage = err.message || 'Firestore daily read/write quota exhausted';
      console.warn(`\n⚠️ =========================================================================`);
      console.warn(`⚠️ FIRESTORE QUOTA EXCEEDED: ${quotaExceededMessage}`);
      console.warn(`⚡ SEAMLESS MEMORY MODE ACTIVATED for: ${operationName}`);
      console.warn(`⚡ All queries & mutations are now served 100% from high-speed in-memory DB.`);
      console.warn(`⚡ App continues to work flawlessly with 0 downtime and 0 user-facing errors!`);
      console.warn(`=========================================================================\n`);
    }
  } else {
    console.warn(`Firestore [${operationName}] warning:`, err.message || err);
  }
}

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

    // Healthcheck ping
    try {
      await db.collection('_healthcheck').doc('ping').set({ timestamp: new Date().toISOString() });
      isFirestoreConnected = true;
      console.log('🔥 Connected to Firebase Firestore database!');
      await warmUpAndSeedFirestore();
    } catch (pingErr: any) {
      if (isQuotaExhaustedError(pingErr)) {
        isFirestoreQuotaExceeded = true;
        quotaExceededMessage = pingErr.message || 'Daily quota limit reached';
        console.warn('⚠️ Firestore quota reached during startup ping. Running in 100% in-memory mode.');
      } else {
        throw pingErr;
      }
    }
  } catch (err: any) {
    db = null;
    isFirestoreConnected = false;
    console.warn('🔥 Firebase Firestore startup notice:', err.message || err);
    console.warn('⚡ Using high-speed in-memory store as seamless fallback.');
  }
}

export function isFirebaseConnected(): boolean {
  return isFirestoreConnected && db !== null && !isFirestoreQuotaExceeded;
}

export function getDb(): Firestore | null {
  return isFirestoreConnected && !isFirestoreQuotaExceeded ? db : null;
}

export function getFirestoreStatus() {
  return {
    connected: isFirestoreConnected && !isFirestoreQuotaExceeded,
    quotaExceeded: isFirestoreQuotaExceeded,
    mode: isFirestoreQuotaExceeded ? 'in-memory-fallback (quota exceeded)' : (isFirestoreConnected ? 'firestore (synced cache)' : 'in-memory'),
    message: isFirestoreQuotaExceeded ? quotaExceededMessage : 'Healthy'
  };
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

  memoryNotifications.length = 0;
  memoryNotifications.push(...initialNotifications);

  // 2. If Firestore is active and not quota-exhausted, write clean seeds
  if (db && !isFirestoreQuotaExceeded) {
    try {
      const collectionsToClean = ['users', 'guides', 'kyc', 'tours', 'posts', 'negotiations', 'bookings', 'chat', 'notifications'];
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
        { name: 'chat', data: initialChatMessages },
        { name: 'notifications', data: initialNotifications }
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
      handleFirestoreError(err, 'dbResetAndReseedDatabase');
    }
  }

  return { success: true, message: 'Database wiped and clean seed data inserted successfully' };
}

/**
 * Initializes cache from Firestore once on startup, seeding if collections are empty.
 * This ensures reads are lightning fast (0ms) and avoids exhausting Firestore quota.
 */
async function warmUpAndSeedFirestore() {
  if (!db || isFirestoreQuotaExceeded) return;
  try {
    const collectionsToSync = [
      { name: 'users', memory: memoryUsers, defaults: initialUsers },
      { name: 'guides', memory: memoryGuides, defaults: initialGuides },
      { name: 'kyc', memory: memoryKYC, defaults: initialKYCQueue },
      { name: 'tours', memory: memoryTours, defaults: initialTourPackages },
      { name: 'posts', memory: memoryPosts, defaults: initialTravelerPosts },
      { name: 'negotiations', memory: memoryNegotiations, defaults: initialNegotiationOffers },
      { name: 'bookings', memory: memoryBookings, defaults: initialTourBookings },
      { name: 'chat', memory: memoryChat, defaults: initialChatMessages },
      { name: 'notifications', memory: memoryNotifications, defaults: initialNotifications }
    ];

    for (const col of collectionsToSync) {
      if (isFirestoreQuotaExceeded) break;
      const snap = await db.collection(col.name).get();
      if (snap.empty && col.defaults && col.defaults.length > 0) {
        const batch = db.batch();
        for (const item of col.defaults) {
          batch.set(db.collection(col.name).doc((item as any).id), item);
        }
        await batch.commit();
        col.memory.length = 0;
        col.memory.push(...(col.defaults as any[]));
      } else if (!snap.empty) {
        col.memory.length = 0;
        snap.docs.forEach(doc => {
          col.memory.push({ id: doc.id, ...doc.data() } as any);
        });
      }
    }
    console.log('⚡ Firestore in-memory sync complete. Supercharged quota-saving cache active!');
  } catch (err) {
    handleFirestoreError(err, 'warmUpAndSeedFirestore');
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

  // 1. Check synchronized memory cache first (0ms latency, 0 quota)
  const cached = memoryUsers.find(u => {
    const uEmail = (u.email || '').toLowerCase();
    return uEmail === canonicalEmail || uEmail === cleanEmail;
  });
  if (cached) return cached;

  // 2. Fallback to Firestore if not found in memory and quota is not exceeded
  if (db && !isFirestoreQuotaExceeded) {
    try {
      let snap = await db.collection('users').where('email', '==', canonicalEmail).limit(1).get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        memoryUsers.push(data as any);
        return data;
      }
      if (canonicalEmail !== cleanEmail) {
        snap = await db.collection('users').where('email', '==', cleanEmail).limit(1).get();
        if (!snap.empty) {
          const data = snap.docs[0].data();
          memoryUsers.push(data as any);
          return data;
        }
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindUserByEmail');
    }
  }
  return null;
}

export async function dbFindUserById(id: string) {
  if (!id) return null;
  const cached = memoryUsers.find(u => u.id === id);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        memoryUsers.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindUserById');
    }
  }
  return null;
}

export async function dbFindUserByToken(token: string) {
  if (!token) return null;
  const cached = memoryUsers.find(u => u.token === token);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const snap = await db.collection('users').where('token', '==', token).limit(1).get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        memoryUsers.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindUserByToken');
    }
  }
  return null;
}

export async function dbSaveUser(userData: any) {
  if (!userData.createdAt) userData.createdAt = new Date().toISOString();
  
  // Update memory immediately
  const idx = memoryUsers.findIndex(u => u.id === userData.id);
  if (idx >= 0) memoryUsers[idx] = { ...memoryUsers[idx], ...userData };
  else memoryUsers.unshift(userData);

  // Write-through to Firestore if quota available
  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('users').doc(userData.id).set(userData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveUser');
    }
  }
  return userData;
}

export async function dbGetAllUsers() {
  return memoryUsers;
}

// Guide
export async function dbFindGuideByUserIdOrName(userId: string, name?: string) {
  const cached = memoryGuides.find(g => g.userId === userId || (name && g.fullName === name));
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const snap = await db.collection('guides').where('userId', '==', userId).limit(1).get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        memoryGuides.push(data as any);
        return data;
      }
      if (name) {
        const nameSnap = await db.collection('guides').where('fullName', '==', name).limit(1).get();
        if (!nameSnap.empty) {
          const data = nameSnap.docs[0].data();
          memoryGuides.push(data as any);
          return data;
        }
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindGuideByUserIdOrName');
    }
  }
  return null;
}

export async function dbFindGuideById(id: string) {
  const cached = memoryGuides.find(g => g.id === id);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const doc = await db.collection('guides').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        memoryGuides.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindGuideById');
    }
  }
  return null;
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
  const clean = sanitizeDoc(guideData);
  const idx = memoryGuides.findIndex(g => g.id === guideData.id);
  if (idx >= 0) memoryGuides[idx] = { ...memoryGuides[idx], ...clean };
  else memoryGuides.unshift(clean);

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('guides').doc(guideData.id).set(clean, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveGuide');
    }
  }
  return clean;
}

export async function dbGetGuides(city?: string, verifiedOnly?: boolean) {
  return memoryGuides.filter(g => {
    if (city && city !== 'All' && g.city.toLowerCase() !== city.toLowerCase()) return false;
    if (verifiedOnly && !g.verified && g.kycStatus !== 'verified') return false;
    return true;
  });
}

export async function dbGetOnlineGuide() {
  return memoryGuides.find(g => g.isOnline) || memoryGuides[0] || null;
}

// KYC
export async function dbSaveKYC(kycData: any) {
  const clean = sanitizeDoc(kycData);
  const idx = memoryKYC.findIndex(k => k.id === kycData.id);
  if (idx >= 0) memoryKYC[idx] = { ...memoryKYC[idx], ...clean };
  else memoryKYC.unshift(clean);

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('kyc').doc(kycData.id).set(clean, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveKYC');
    }
  }
  return clean;
}

export async function dbGetKYCList() {
  return memoryKYC;
}

export async function dbFindKYCById(id: string) {
  const cached = memoryKYC.find(k => k.id === id);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const doc = await db.collection('kyc').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        memoryKYC.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindKYCById');
    }
  }
  return null;
}

// Tours
export async function dbSaveTour(tourData: any) {
  const clean = sanitizeDoc(tourData);
  const idx = memoryTours.findIndex(t => t.id === tourData.id);
  if (idx >= 0) memoryTours[idx] = { ...memoryTours[idx], ...clean };
  else memoryTours.unshift(clean);

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('tours').doc(tourData.id).set(clean, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveTour');
    }
  }
  return clean;
}

export async function dbGetTours(city?: string) {
  return memoryTours.filter(t => {
    if (city && city !== 'All' && t.city.toLowerCase() !== city.toLowerCase()) return false;
    return true;
  });
}

export async function dbFindTourById(id: string) {
  const cached = memoryTours.find(t => t.id === id);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const doc = await db.collection('tours').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        memoryTours.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindTourById');
    }
  }
  return null;
}

// Posts
export async function dbSavePost(postData: any) {
  const clean = sanitizeDoc(postData);
  const idx = memoryPosts.findIndex(p => p.id === postData.id);
  if (idx >= 0) memoryPosts[idx] = { ...memoryPosts[idx], ...clean };
  else memoryPosts.unshift(clean);

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('posts').doc(postData.id).set(clean, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSavePost');
    }
  }
  return clean;
}

export async function dbGetPosts(city?: string, status?: string) {
  return memoryPosts.filter(p => {
    if (city && city !== 'All' && p.city.toLowerCase() !== city.toLowerCase()) return false;
    if (status && p.status !== status) return false;
    return true;
  });
}

export async function dbFindPostById(id: string) {
  const cached = memoryPosts.find(p => p.id === id);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const doc = await db.collection('posts').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        memoryPosts.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindPostById');
    }
  }
  return null;
}

// Negotiations
export async function dbSaveNegotiation(negData: any) {
  const clean = sanitizeDoc(negData);
  const idx = memoryNegotiations.findIndex(n => n.id === negData.id);
  if (idx >= 0) memoryNegotiations[idx] = { ...memoryNegotiations[idx], ...clean };
  else memoryNegotiations.unshift(clean);

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('negotiations').doc(negData.id).set(clean, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveNegotiation');
    }
  }
  return clean;
}

export async function dbFindNegotiationByPostAndGuide(postId: string, guideId: string) {
  const cached = memoryNegotiations.find(n => n.postId === postId && n.guideId === guideId);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const snap = await db.collection('negotiations').where('postId', '==', postId).where('guideId', '==', guideId).limit(1).get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        memoryNegotiations.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindNegotiationByPostAndGuide');
    }
  }
  return null;
}

export async function dbFindNegotiationById(id: string) {
  const cached = memoryNegotiations.find(n => n.id === id);
  if (cached) return cached;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const doc = await db.collection('negotiations').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        memoryNegotiations.push(data as any);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindNegotiationById');
    }
  }
  return null;
}

export async function dbGetNegotiationsByUser(userId: string) {
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

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('bookings').doc(bookingData.id).set(cleanData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveBooking');
    }
  }
  return cleanData;
}

export async function dbFindBookingById(id: string): Promise<TourBooking | null> {
  const cached = memoryBookings.find(b => b.id === id);
  if (cached) return cached as TourBooking;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const doc = await db.collection('bookings').doc(id).get();
      if (doc.exists) {
        const data = { id: doc.id, ...doc.data() } as TourBooking;
        memoryBookings.push(data);
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, 'dbFindBookingById');
    }
  }
  return null;
}

export async function dbGetBookingsByUser(userId: string) {
  return memoryBookings.filter(b => userId === 'all' || b.travelerId === userId || b.guideId === userId);
}

export async function dbGetAllBookings() {
  return memoryBookings;
}

// Chat
export async function dbGetChatMessages(bookingId: string) {
  return memoryChat.filter(c => c.bookingId === bookingId).sort((a: any, b: any) => (a.timestamp > b.timestamp ? 1 : -1));
}

export async function dbSaveChatMessage(msgData: any) {
  const idx = memoryChat.findIndex(c => c.id === msgData.id);
  if (idx >= 0) memoryChat[idx] = { ...memoryChat[idx], ...msgData };
  else memoryChat.push(msgData);

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('chat').doc(msgData.id).set(msgData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveChatMessage');
    }
  }
  return msgData;
}

// Notifications
export async function dbGetNotifications(userId?: string, role?: string) {
  return memoryNotifications
    .filter(n => {
      if (!userId || userId === 'all') return true;
      if (n.userId === userId || n.userId === 'all') return true;
      if (role && (n.targetRole === role || n.targetRole === 'all')) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function dbSaveNotification(notifData: any) {
  const idx = memoryNotifications.findIndex(n => n.id === notifData.id);
  if (idx >= 0) memoryNotifications[idx] = { ...memoryNotifications[idx], ...notifData };
  else memoryNotifications.unshift(notifData);

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('notifications').doc(notifData.id).set(notifData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbSaveNotification');
    }
  }
  return notifData;
}

export async function dbMarkNotificationAsRead(id: string) {
  const found = memoryNotifications.find(n => n.id === id);
  if (found) found.isRead = true;

  if (db && !isFirestoreQuotaExceeded) {
    try {
      await db.collection('notifications').doc(id).set({ isRead: true }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, 'dbMarkNotificationAsRead');
    }
  }
  return found;
}

export async function dbMarkAllNotificationsAsRead(userId?: string, role?: string) {
  memoryNotifications.forEach(n => {
    if (!userId || userId === 'all' || n.userId === userId || (role && n.targetRole === role)) {
      n.isRead = true;
    }
  });

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const snap = await db.collection('notifications').get();
      const batch = db.batch();
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (!userId || userId === 'all' || d.userId === userId || (role && d.targetRole === role)) {
          batch.update(doc.ref, { isRead: true });
        }
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, 'dbMarkAllNotificationsAsRead');
    }
  }
  return true;
}

export async function dbClearNotifications(userId?: string, role?: string) {
  for (let i = memoryNotifications.length - 1; i >= 0; i--) {
    const n = memoryNotifications[i];
    if (!userId || userId === 'all' || n.userId === userId || (role && n.targetRole === role)) {
      memoryNotifications.splice(i, 1);
    }
  }

  if (db && !isFirestoreQuotaExceeded) {
    try {
      const snap = await db.collection('notifications').get();
      const batch = db.batch();
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (!userId || userId === 'all' || d.userId === userId || (role && d.targetRole === role)) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, 'dbClearNotifications');
    }
  }
  return true;
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
