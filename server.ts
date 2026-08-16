import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  initFirebaseDatabase, 
  getFirestoreStatus,
  dbResetAndReseedDatabase,
  dbFindUserByEmail,
  dbFindUserById,
  dbFindUserByToken,
  dbSaveUser,
  dbGetAllUsers,
  dbFindGuideByUserIdOrName,
  dbFindGuideById,
  dbSaveGuide,
  dbGetGuides,
  dbGetOnlineGuide,
  dbSaveKYC,
  dbGetKYCList,
  dbFindKYCById,
  dbSaveTour,
  dbGetTours,
  dbFindTourById,
  dbSavePost,
  dbGetPosts,
  dbFindPostById,
  dbSaveNegotiation,
  dbFindNegotiationByPostAndGuide,
  dbFindNegotiationById,
  dbGetNegotiationsByUser,
  dbSaveBooking,
  dbFindBookingById,
  dbGetBookingsByUser,
  dbGetAllBookings,
  dbGetChatMessages,
  dbSaveChatMessage,
  dbGetNotifications,
  dbSaveNotification,
  dbMarkNotificationAsRead,
  dbMarkAllNotificationsAsRead,
  dbClearNotifications
} from './src/db/firebase.js';
import { AdminSystemStats, AppNotification } from './src/types.js';

// Initialize Express App
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to create and broadcast in-app notifications
async function sendInAppNotification(params: {
  userId: string;
  targetRole?: 'traveler' | 'guide' | 'admin' | 'all';
  type: 'bid' | 'accept' | 'counter' | 'chat' | 'booking' | 'escrow' | 'kyc' | 'system' | 'payout';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  bookingId?: string;
  postId?: string;
  negotiationId?: string;
  senderName?: string;
  senderAvatar?: string;
  amountUSD?: number;
}): Promise<AppNotification> {
  const notif: AppNotification = {
    id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    userId: params.userId,
    targetRole: params.targetRole || 'all',
    type: params.type,
    title: params.title,
    message: params.message,
    isRead: false,
    createdAt: new Date().toISOString(),
    icon: params.icon || 'notifications',
    actionUrl: params.actionUrl || '/',
    bookingId: params.bookingId,
    postId: params.postId,
    negotiationId: params.negotiationId,
    senderName: params.senderName,
    senderAvatar: params.senderAvatar,
    amountUSD: params.amountUSD
  };
  await dbSaveNotification(notif);
  return notif;
}

// Helper to safely initialize Google Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize Gemini Client:', err);
    return null;
  }
}

// ==================== AUTHENTICATION API ====================

app.post('/api/auth/google-verify', async (req, res) => {
  try {
    const { credential, role, email: clientEmail, name: clientName, picture: clientPic, firebaseUid } = req.body;

    if (!credential && !clientEmail) {
      return res.status(400).json({ error: 'Missing credential payload from Google Sign-In' });
    }

    let verifiedEmail = clientEmail || '';
    let name = clientName || '';
    let picture = clientPic || '';
    let googleSub = firebaseUid || '';

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          if (payload.email) verifiedEmail = payload.email;
          if (payload.name || payload.given_name) name = payload.name || payload.given_name;
          if (payload.picture) picture = payload.picture;
          if (payload.sub || payload.user_id) googleSub = payload.sub || payload.user_id;
        }
      } catch (e) {
        console.warn('Backend JWT decode warning:', e);
      }

      if (!verifiedEmail) {
        try {
          const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          const googleUser = await googleRes.json();
          if (!googleUser.error_description && googleUser.email) {
            verifiedEmail = googleUser.email;
            name = googleUser.name || name;
            picture = googleUser.picture || picture;
            googleSub = googleUser.sub || googleSub;
          }
        } catch (fetchErr) {
          console.warn('Google tokeninfo fetch warning:', fetchErr);
        }
      }
    }

    if (!verifiedEmail) {
      return res.status(400).json({ error: 'Could not extract verified email from Google ID Token.' });
    }

    let existingUser = await dbFindUserByEmail(verifiedEmail);

    if (!existingUser) {
      const assignedRole = role || (verifiedEmail.includes('admin') ? 'admin' : verifiedEmail.includes('guide') ? 'guide' : 'traveler');
      const userId = 'u_' + (googleSub || Date.now());
      const userAvatar = picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

      let guideProfileObj: any = null;
      if (assignedRole === 'guide') {
        const newGuideObj = {
          id: 'g_' + Date.now(),
          userId: userId,
          fullName: name || 'Google User',
          avatar: userAvatar,
          city: 'Ho Chi Minh City',
          rating: 5.0,
          reviewCount: 0,
          hourlyRateUSD: 25,
          languages: ['English'],
          bio: 'Verified Google Tourist Guide',
          tourTypes: ['walking', 'food'],
          badges: ['Google Verified 🔵', 'Licensed Guide 📜'],
          isOnline: true,
          currentLat: 10.7769,
          currentLng: 106.7009,
          verified: true,
          kycStatus: 'verified',
          completedTours: 0
        };
        await dbSaveGuide(newGuideObj);
        guideProfileObj = newGuideObj;
      }

      existingUser = {
        id: userId,
        name: name || 'Google User',
        email: verifiedEmail,
        role: assignedRole,
        avatar: userAvatar,
        phone: '+1 555-0199',
        bio: 'Verified Google Account user',
        status: 'active',
        guideProfile: guideProfileObj
      };
      await dbSaveUser(existingUser);
    } else {
      if (name) existingUser.name = name;
      if (picture) existingUser.avatar = picture;
    }

    if (existingUser.role === 'guide') {
      let gProfile = await dbFindGuideByUserIdOrName(existingUser.id, existingUser.name);
      if (!gProfile) {
        gProfile = {
          id: 'g_' + Date.now(),
          userId: existingUser.id,
          fullName: existingUser.name,
          avatar: existingUser.avatar,
          city: 'Ho Chi Minh City',
          rating: 5.0,
          reviewCount: 0,
          hourlyRateUSD: 25,
          languages: ['English', 'Vietnamese'],
          bio: existingUser.bio || 'Verified Google Tourist Guide',
          tourTypes: ['walking', 'food'],
          badges: ['Google Verified 🔵', 'Licensed Guide 📜'],
          isOnline: true,
          currentLat: 10.7769,
          currentLng: 106.7009,
          verified: true,
          kycStatus: 'verified',
          completedTours: 0
        };
        await dbSaveGuide(gProfile);
      } else {
        gProfile.fullName = existingUser.name;
        gProfile.avatar = existingUser.avatar;
        await dbSaveGuide(gProfile);
      }
      existingUser.guideProfile = gProfile;
    }

    const serverSessionToken = 'g_verified_sess_' + Buffer.from(`${existingUser.id}:${Date.now()}`).toString('base64');
    existingUser.token = serverSessionToken;
    await dbSaveUser(existingUser);

    res.json({
      success: true,
      verifiedByBackend: true,
      user: existingUser,
      token: serverSessionToken,
      verifiedEmail
    });

  } catch (err: any) {
    console.error('Google Auth Backend Verification Error:', err);
    res.status(500).json({ error: 'Server backend Google token verification failed', details: err.message });
  }
});

app.get('/api/auth/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ verified: false, error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    let foundUser = await dbFindUserByToken(token);

    if (foundUser) {
      if (foundUser.role === 'guide') {
        const gProfile = await dbFindGuideByUserIdOrName(foundUser.id, foundUser.name);
        if (gProfile) {
          foundUser.guideProfile = gProfile;
        }
      }
      return res.json({ verified: true, user: foundUser });
    } else {
      return res.status(401).json({ verified: false, error: 'Expired or untrusted session token' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, bio } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await dbFindUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const token = 'jwt_simulated_' + Date.now();
    const userId = 'u_' + Date.now();
    const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    let guideProfileObj: any = null;
    if ((role || 'traveler') === 'guide') {
      const newGuide = {
        id: 'g_' + Date.now(),
        userId: userId,
        fullName: name.trim(),
        avatar: userAvatar,
        city: 'Ho Chi Minh City',
        rating: 5.0,
        reviewCount: 0,
        hourlyRateUSD: 20,
        languages: ['English', 'Vietnamese'],
        bio: bio || 'Friendly local guide ready for authentic tours!',
        tourTypes: ['walking', 'food'],
        badges: ['New Guide 🌟'],
        isOnline: true,
        currentLat: 10.7769,
        currentLng: 106.7009,
        verified: false,
        kycStatus: 'unsubmitted',
        completedTours: 0
      };
      await dbSaveGuide(newGuide);
      guideProfileObj = newGuide;
    }

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      role: role || 'traveler',
      avatar: userAvatar,
      phone: phone || '+84 901 234 567',
      bio: bio || 'Local travel enthusiast',
      status: 'active',
      token,
      guideProfile: guideProfileObj
    };

    await dbSaveUser(newUser);
    res.json({ success: true, user: newUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email && !role) {
      return res.status(400).json({ error: 'Email address is required to sign in' });
    }
    
    if (role === 'admin' && (!email || email === 'admin@tourguidehub.com')) {
      let adminUser = await dbFindUserByEmail('admin@tourguidehub.com');
      if (!adminUser) {
        adminUser = {
          id: 'u_admin_1',
          name: 'Alexander Wright (Platform Admin)',
          email: 'admin@tourguidehub.com',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          phone: '+1 800-555-0199',
          bio: 'Tour Guide Hub Operations & Back-Office Compliance Lead.',
          status: 'active'
        };
      }
      const token = 'jwt_simulated_' + Date.now();
      adminUser.token = token;
      await dbSaveUser(adminUser);
      return res.json({ success: true, user: adminUser, token });
    }

    const found = await dbFindUserByEmail(email || '');
    if (found) {
      if (found.role === 'guide') {
        let gProfile = await dbFindGuideByUserIdOrName(found.id, found.name);
        if (!gProfile) {
          gProfile = {
            id: 'g_' + Date.now(),
            userId: found.id,
            fullName: found.name,
            avatar: found.avatar,
            city: 'Ho Chi Minh City',
            rating: 5.0,
            reviewCount: 0,
            hourlyRateUSD: 25,
            languages: ['English', 'Vietnamese'],
            bio: found.bio || 'Local tourist guide',
            tourTypes: ['walking', 'food'],
            badges: ['Guide 📜'],
            isOnline: true,
            currentLat: 10.7769,
            currentLng: 106.7009,
            verified: true,
            kycStatus: 'verified',
            completedTours: 0
          };
          await dbSaveGuide(gProfile);
        }
        found.guideProfile = gProfile;
      }
      const token = found.token || 'jwt_simulated_' + Date.now();
      found.token = token;
      await dbSaveUser(found);
      return res.json({ success: true, user: found, token });
    }

    return res.status(401).json({ error: 'No account found with this email. Please sign up or check your credentials.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ADMIN MODULE API ----------------
app.post('/api/admin/reset-database', async (req, res) => {
  try {
    const result = await dbResetAndReseedDatabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset and reseed database: ' + err.message });
  }
});

app.get('/api/health', (req, res) => {
  const dbStatus = getFirestoreStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

app.get('/api/admin/db-status', (req, res) => {
  res.json(getFirestoreStatus());
});

app.get('/api/admin/reset-database', async (req, res) => {
  try {
    const result = await dbResetAndReseedDatabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset and reseed database: ' + err.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const users = await dbGetAllUsers();
    const guides = await dbGetGuides('All');
    const kycList = await dbGetKYCList();
    const posts = await dbGetPosts('All', 'open');
    const tours = await dbGetTours('All');
    const allBookings = await dbGetAllBookings();

    const stats: AdminSystemStats = {
      totalUsers: users.length,
      totalGuides: guides.length,
      totalTravelers: users.filter((u: any) => u.role === 'traveler').length,
      totalPendingKYC: kycList.filter((k: any) => k.status === 'pending').length,
      totalActivePosts: posts.length,
      totalTours: tours.length,
      totalBookings: allBookings.length,
      totalRevenueUSD: (allBookings as any[]).reduce((sum: number, b: any) => sum + (b.totalPriceUSD || 0), 0)
    };
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/kyc-list', async (req, res) => {
  try {
    const kycList = await dbGetKYCList();
    res.json({ kycList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/kyc/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason, declineInstructions } = req.body;

    const application = await dbFindKYCById(id);
    if (!application) {
      return res.status(404).json({ error: 'KYC application not found' });
    }

    const guide = await dbFindGuideById(application.guideId);

    if (action === 'approve') {
      application.status = 'verified';
      if (guide) {
        guide.verified = true;
        guide.kycStatus = 'verified';
        if (!guide.badges) guide.badges = [];
        if (!guide.badges.includes('Verified Guide Card 📜')) {
          guide.badges.push('Verified Guide Card 📜');
        }
        await dbSaveGuide(guide);
      }
      await sendInAppNotification({
        userId: application.guideId,
        targetRole: 'guide',
        type: 'kyc',
        title: '🎉 Tour Guide License Approved!',
        message: 'Congratulations! Your tourist guide card has been verified. You can now publish custom tour packages and place bids on traveler requests.',
        icon: 'verified',
        actionUrl: '/guide'
      });
    } else {
      application.status = 'rejected';
      application.rejectionReason = rejectionReason || 'Tour Guide card or CCCD unverified on official portal.';
      application.declineInstructions = declineInstructions || 'Please re-upload clear photos of your CCCD and valid Tour Guide Card, then re-submit.';
      if (guide) {
        guide.verified = false;
        guide.kycStatus = 'rejected';
        await dbSaveGuide(guide);
      }
      await sendInAppNotification({
        userId: application.guideId,
        targetRole: 'guide',
        type: 'kyc',
        title: '⚠️ KYC License Verification Notice',
        message: application.rejectionReason || 'Please review your guide card credentials and re-submit.',
        icon: 'warning',
        actionUrl: '/guide'
      });
    }

    await dbSaveKYC(application);
    res.json({ application, guide });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await dbGetAllUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const u = await dbFindUserById(id);
    if (!u) return res.status(404).json({ error: 'User not found' });

    u.status = status;
    await dbSaveUser(u);
    res.json({ user: u });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TOURIST GUIDE MODULE API ----------------
app.post('/api/guide/kyc', async (req, res) => {
  try {
    const {
      guideId,
      cardNumber,
      issuingAuthority,
      expiryDate,
      cardImageUrl,
      cccdNumber,
      cccdFrontUrl,
      cccdBackUrl,
      facePhotoUrl,
      tourGuideCardUrl,
      agreedToTerms
    } = req.body;

    const guide = await dbFindGuideById(guideId);
    if (!guide) {
      return res.status(404).json({ error: 'Guide profile not found' });
    }

    const finalCardNumber = cardNumber || '101180293';
    const finalCardImg = tourGuideCardUrl || cardImageUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';

    const newApp = {
      id: 'kyc_' + Date.now(),
      guideId: guide.id,
      guideName: guide.fullName,
      guideAvatar: guide.avatar,
      cardNumber: finalCardNumber,
      issuingAuthority: issuingAuthority || 'Vietnam National Authority of Tourism (VNAT)',
      expiryDate: expiryDate || '2030-12-31',
      cardImageUrl: finalCardImg,
      cccdNumber: cccdNumber || '079201008892',
      cccdFrontUrl: cccdFrontUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      cccdBackUrl: cccdBackUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
      facePhotoUrl: facePhotoUrl || guide.avatar,
      tourGuideCardUrl: finalCardImg,
      agreedToTerms: agreedToTerms !== false,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    await dbSaveKYC(newApp);

    guide.kycStatus = 'pending';
    guide.kycCardNumber = newApp.cardNumber;
    await dbSaveGuide(guide);

    await sendInAppNotification({
      userId: 'u_admin',
      targetRole: 'admin',
      type: 'kyc',
      title: '🛡️ New KYC Verification Submission',
      message: `Guide ${guide.fullName} submitted a tourist guide card for verification (Card #${finalCardNumber}).`,
      icon: 'verified_user',
      actionUrl: '/admin'
    });

    res.json({ kycApplication: newApp, guide });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Guide Payout Bank Account Setting
app.post('/api/guide/:id/bank-account', async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, accountNumber, accountHolder, swiftCode, branchName } = req.body;

    if (!bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ error: 'Bank name, account number, and account holder name are required' });
    }

    const guide = await dbFindGuideById(id);
    if (!guide) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    const bankAccount = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      swiftCode: swiftCode ? swiftCode.trim().toUpperCase() : '',
      branchName: branchName ? branchName.trim() : '',
      isVerified: true,
      updatedAt: new Date().toISOString()
    };

    guide.bankAccount = bankAccount;
    await dbSaveGuide(guide);

    // Also sync to user object if matching
    const user = await dbFindUserById(guide.userId);
    if (user && user.guideProfile) {
      user.guideProfile.bankAccount = bankAccount;
      await dbSaveUser(user);
    }

    await sendInAppNotification({
      userId: guide.id,
      targetRole: 'guide',
      type: 'payout',
      title: '🏦 Payout Account Connected',
      message: `Bank account ${bankAccount.bankName} (••••${bankAccount.accountNumber.slice(-4)}) connected for instant NAPAS 24/7 disbursements.`,
      icon: 'account_balance',
      actionUrl: '/guide'
    });

    res.json({ success: true, bankAccount, guide });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tours/create', async (req, res) => {
  try {
    const { guideId, title, city, category, durationHours, priceUSDPerPerson, imageUrl, description, inclusions, itinerarySummary } = req.body;

    let guide = await dbFindGuideById(guideId);
    if (!guide) {
      const allGuides = await dbGetGuides('All');
      guide = allGuides[0];
    }

    if (!guide) {
      return res.status(400).json({ error: 'Guide profile not found' });
    }

    if (!guide.verified && guide.kycStatus !== 'verified') {
      return res.status(403).json({
        error: 'License verification required. Unverified tour guides cannot create tour packages until approved.'
      });
    }

    const newTour = {
      id: 'tp_' + Date.now(),
      title,
      city: city || guide.city,
      category: category || 'Custom Tour',
      durationHours: Number(durationHours) || 3,
      priceUSDPerPerson: Number(priceUSDPerPerson) || 30,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      description: description || 'Exciting tour hosted by verified local guide.',
      inclusions: inclusions || ['Local Guide Service', 'Tastings & Refreshments'],
      itinerarySummary: itinerarySummary || 'Custom curated itinerary by guide.',
      guideId: guide.id,
      guideName: guide.fullName,
      guideAvatar: guide.avatar,
      rating: 5.0,
      reviewsCount: 1,
      status: 'published',
      createdAt: new Date().toISOString()
    };

    await dbSaveTour(newTour);
    res.json({ tour: newTour });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tours/update', async (req, res) => {
  try {
    const { tourId, guideId, title, city, category, durationHours, priceUSDPerPerson, imageUrl, description, inclusions, itinerarySummary, scheduleSlots } = req.body;

    const existingTour = await dbFindTourById(tourId);
    if (!existingTour) {
      return res.status(404).json({ error: 'Tour package not found' });
    }

    // Check if there are active negotiations or bookings for this tour
    const allNegs = await dbGetNegotiationsByUser('all');
    const activeNegs = allNegs.filter((n: any) => 
      (n.tourId === tourId || (n.tourTitle && existingTour.title && n.tourTitle.toLowerCase() === existingTour.title.toLowerCase())) &&
      n.status !== 'declined'
    );

    const allBookings = await dbGetBookingsByUser('all');
    const activeBookings = allBookings.filter((b: any) => 
      (b.tourId === tourId || (b.tourTitle && existingTour.title && b.tourTitle.toLowerCase() === existingTour.title.toLowerCase())) &&
      b.status !== 'cancelled'
    );

    if (activeNegs.length > 0 || activeBookings.length > 0) {
      return res.status(400).json({
        error: `Cannot edit tour: This tour has ${activeNegs.length} active negotiation(s) and ${activeBookings.length} booking(s). Editing is only permitted when no negotiations or bookings exist.`
      });
    }

    const updatedTour = {
      ...existingTour,
      title: title || existingTour.title,
      city: city || existingTour.city,
      category: category || existingTour.category,
      durationHours: Number(durationHours) || existingTour.durationHours,
      priceUSDPerPerson: Number(priceUSDPerPerson) || existingTour.priceUSDPerPerson,
      imageUrl: imageUrl || existingTour.imageUrl,
      description: description !== undefined ? description : existingTour.description,
      inclusions: inclusions || existingTour.inclusions,
      itinerarySummary: itinerarySummary !== undefined ? itinerarySummary : existingTour.itinerarySummary,
      scheduleSlots: scheduleSlots || existingTour.scheduleSlots || []
    };

    await dbSaveTour(updatedTour);
    res.json({ tour: updatedTour });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/guides', async (req, res) => {
  try {
    const { city, verifiedOnly } = req.query;
    const guides = await dbGetGuides(city as string, verifiedOnly === 'true');
    res.json({ guides });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tours', async (req, res) => {
  try {
    const { city } = req.query;
    const tours = await dbGetTours(city as string);
    res.json({ tours });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TRAVELER MODULE API ----------------
app.post('/api/traveler/posts', async (req, res) => {
  try {
    const {
      travelerId,
      travelerName,
      travelerAvatar,
      title,
      city,
      preferredDate,
      scheduleSlots,
      durationHours,
      groupSize,
      minBudgetUSD,
      maxBudgetUSD,
      description,
      preferredLanguages,
      depositAmountUSD,
      depositStatus,
      depositPaymentMethod,
      depositTxId,
      depositPaidAt
    } = req.body;

    if (!title || !city) {
      return res.status(400).json({ error: 'Title and city are required' });
    }

    const tId = travelerId || 'u_traveler_1';

    // Server-side Conflict Prevention against confirmed bookings
    const userBookings = await dbGetBookingsByUser(tId);
    const activeBookings = userBookings.filter((b: any) => b.status !== 'cancelled');

    // Helper to parse time string into minutes
    const parseTimeToMin = (timeStr: string): number => {
      if (!timeStr) return 0;
      const lower = timeStr.toLowerCase().trim();
      const match12 = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = match12[2] ? parseInt(match12[2], 10) : 0;
        const isPm = match12[3].toLowerCase() === 'pm';
        const isAm = match12[3].toLowerCase() === 'am';
        if (isPm && h < 12) h += 12;
        if (isAm && h === 12) h = 0;
        return h * 60 + m;
      }
      const match24 = lower.match(/(\d{1,2}):(\d{2})/);
      if (match24) {
        const h = parseInt(match24[1], 10);
        const m = parseInt(match24[2], 10);
        return (h % 24) * 60 + m;
      }
      return 0;
    };

    // Helper to normalize date to YYYY-MM-DD
    const normDate = (dStr?: string): string | null => {
      if (!dStr) return null;
      const mIso = dStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (mIso) return `${mIso[1]}-${mIso[2]}-${mIso[3]}`;
      const mSlash = dStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (mSlash) return `${mSlash[3]}-${mSlash[2].padStart(2, '0')}-${mSlash[1].padStart(2, '0')}`;
      const mDash = dStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
      if (mDash) return `${mDash[3]}-${mDash[2].padStart(2, '0')}-${mDash[1].padStart(2, '0')}`;
      return null;
    };

    // Check each slot in scheduleSlots
    if (scheduleSlots && Array.isArray(scheduleSlots) && scheduleSlots.length > 0) {
      for (const slot of scheduleSlots) {
        const slotDate = normDate(slot.dateStr);
        if (!slotDate) continue;
        let sStart = parseTimeToMin(slot.startTime);
        let sEnd = parseTimeToMin(slot.endTime);
        if (sEnd <= sStart) sEnd = sEnd === 0 ? 1440 : sEnd + 1440;

        for (const bk of activeBookings) {
          const bkDate = normDate(bk.scheduledTime) || normDate(bk.createdAt);
          if (!bkDate || bkDate !== slotDate) continue;

          let bkStart = 8 * 60;
          let bkEnd = 14 * 60;
          let bkDisplay = bk.scheduledTime || '08:00 AM - 02:00 PM';

          const timeOnly = (bk.scheduledTime || '')
            .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '')
            .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g, '')
            .replace(/[()]/g, ' ')
            .trim();

          const rangeMatch = timeOnly.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|—|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
          if (rangeMatch) {
            bkStart = parseTimeToMin(rangeMatch[1]);
            let eM = parseTimeToMin(rangeMatch[2]);
            if (eM > 0 && bkStart >= 0) {
              if (eM <= bkStart) eM += 1440;
              bkEnd = eM;
              bkDisplay = `${rangeMatch[1].trim()} - ${rangeMatch[2].trim()}`;
            }
          }

          // Overlap check
          if (Math.max(sStart, bkStart) < Math.min(sEnd, bkEnd)) {
            return res.status(400).json({
              error: `Schedule conflict on ${slotDate}: Your requested slot "${slot.startTime} - ${slot.endTime}" overlaps with confirmed booking "${bk.tourTitle}" (${bkDisplay}).`,
              conflictBookingId: bk.id
            });
          }
        }
      }
    }

    const newPost = {
      id: 'post_' + Date.now(),
      travelerId: tId,
      travelerName: travelerName || 'Sarah Jenkins',
      travelerAvatar: travelerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      title,
      city,
      preferredDate: preferredDate || 'Tomorrow at 09:00 AM',
      scheduleSlots: scheduleSlots || [],
      durationHours: Number(durationHours) || 4,
      groupSize: Number(groupSize) || 1,
      minBudgetUSD: Number(minBudgetUSD) || 30,
      maxBudgetUSD: Number(maxBudgetUSD) || 60,
      description: description || 'Looking for an experienced local guide to explore hidden gems!',
      preferredLanguages: preferredLanguages || ['English'],
      status: 'open',
      createdAt: new Date().toISOString(),
      bidsCount: 0,
      depositAmountUSD: Number(depositAmountUSD) || Number(maxBudgetUSD) || 60,
      depositStatus: (depositStatus as any) || 'paid_in_escrow',
      depositPaymentMethod: depositPaymentMethod || 'visa',
      depositTxId: depositTxId || ('ESCROW_DEP_' + Date.now()),
      depositPaidAt: depositPaidAt || new Date().toISOString()
    };

    await dbSavePost(newPost);

    // Dispatch in-app notification to all guides
    await sendInAppNotification({
      userId: 'all',
      targetRole: 'guide',
      type: 'bid',
      title: `📢 New Traveler Request in ${city}`,
      message: `${newPost.travelerName} created a new tour request: "${newPost.title}" (Budget: $${newPost.minBudgetUSD}-$${newPost.maxBudgetUSD} USD).`,
      icon: 'campaign',
      actionUrl: '/guide',
      postId: newPost.id,
      senderName: newPost.travelerName,
      senderAvatar: newPost.travelerAvatar
    });

    res.json({ post: newPost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/traveler/posts', async (req, res) => {
  try {
    const { city, status } = req.query;
    const posts = await dbGetPosts(city as string, status as string);
    res.json({ posts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/traveler/posts/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await dbFindPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Traveler post request not found' });
    }
    post.status = 'closed';
    if (post.depositStatus === 'paid_in_escrow') {
      post.depositStatus = 'refunded';
    }
    await dbSavePost(post);
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/traveler/posts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const post = await dbFindPostById(id);
    if (!post) {
      return res.status(404).json({ error: 'Traveler post request not found' });
    }
    if (!['open', 'negotiating', 'booked', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid post status' });
    }
    post.status = status;
    await dbSavePost(post);
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- NEGOTIATIONS & BOOKINGS ----------------
app.post('/api/negotiations/offer', async (req, res) => {
  try {
    const { postId, tourId, tourTitle, selectedSlot, groupSize, originalPriceUSD, travelerId, travelerName, guideId, offeredPriceUSD, message, senderRole } = req.body;

    let guide = await dbFindGuideById(guideId);
    if (!guide) {
      const allGuides = await dbGetGuides('All');
      guide = allGuides.find(g => g.id === guideId) || allGuides[0];
    }

    if (!guide) {
      return res.status(400).json({ error: 'Guide profile not found' });
    }

    if (senderRole === 'guide' && !guide.verified && guide.kycStatus !== 'verified') {
      return res.status(403).json({
        error: 'License verification required. Unverified tour guides cannot place bids on traveler requests until approved.'
      });
    }

    let offer: any = null;
    let post: any = null;
    if (postId) {
      offer = await dbFindNegotiationByPostAndGuide(postId, guide.id);
      post = await dbFindPostById(postId);
    } else if (tourId) {
      const allNegs = await dbGetNegotiationsByUser('all');
      offer = allNegs.find(n => n.tourId === tourId && n.travelerId === (travelerId || 'u_traveler_1') && n.status !== 'declined');
    }

    if (post && post.status === 'closed' && !offer) {
      return res.status(400).json({ error: 'This traveler trip request is closed and not accepting new bids.' });
    }

    const effectiveSlot = selectedSlot || (post?.scheduleSlots && post.scheduleSlots[0]) || (post?.preferredDate ? { dateStr: post.preferredDate, startTime: '08:30 AM', endTime: '12:30 PM' } : undefined);

    if (!offer) {
      offer = {
        id: 'neg_' + Date.now(),
        postId,
        tourId,
        tourTitle: tourTitle || post?.title,
        selectedSlot: effectiveSlot,
        groupSize: groupSize || post?.groupSize || 1,
        travelerId: post?.travelerId || travelerId || 'u_traveler_1',
        travelerName: post?.travelerName || travelerName || 'Sarah Jenkins',
        guideId: guide.id,
        guideName: guide.fullName,
        guideAvatar: guide.avatar,
        guideRating: guide.rating,
        offeredPriceUSD: Number(offeredPriceUSD) || 50,
        originalPriceUSD: Number(originalPriceUSD) || (post?.maxBudgetUSD) || Number(offeredPriceUSD) || 50,
        lastSenderRole: senderRole || 'traveler',
        status: 'pending',
        messages: [],
        createdAt: post?.preferredDate || (post?.scheduleSlots?.[0]?.dateStr) || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (post) {
        post.bidsCount = (post.bidsCount || 0) + 1;
        await dbSavePost(post);
      }
    } else {
      if (post) {
        if (post.travelerId) offer.travelerId = post.travelerId;
        if (post.travelerName) offer.travelerName = post.travelerName;
        if (post.title) offer.tourTitle = post.title;
      }
      if (!offer.selectedSlot && effectiveSlot) {
        offer.selectedSlot = effectiveSlot;
      }
    }

    offer.offeredPriceUSD = Number(offeredPriceUSD) || offer.offeredPriceUSD;
    if (originalPriceUSD) offer.originalPriceUSD = Number(originalPriceUSD);
    if (tourTitle) offer.tourTitle = tourTitle;
    if (selectedSlot || effectiveSlot) offer.selectedSlot = selectedSlot || offer.selectedSlot || effectiveSlot;
    if (groupSize) offer.groupSize = groupSize;
    offer.lastSenderRole = senderRole || 'traveler';
    offer.status = 'pending';
    offer.updatedAt = new Date().toISOString();

    if (message) {
      offer.messages.push({
        senderRole: senderRole || 'traveler',
        text: message,
        priceUSD: Number(offeredPriceUSD),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    await dbSaveNegotiation(offer);

    // Send in-app notification to receiver
    if (senderRole === 'guide') {
      await sendInAppNotification({
        userId: offer.travelerId,
        targetRole: 'traveler',
        type: 'bid',
        title: `💬 New Bid: $${offer.offeredPriceUSD} USD`,
        message: `Guide ${guide.fullName} placed a bid of $${offer.offeredPriceUSD} USD on "${offer.tourTitle}".${message ? ` Message: "${message}"` : ''}`,
        icon: 'local_offer',
        actionUrl: '/traveler',
        postId: offer.postId,
        negotiationId: offer.id,
        senderName: guide.fullName,
        senderAvatar: guide.avatar,
        amountUSD: offer.offeredPriceUSD
      });
    } else {
      await sendInAppNotification({
        userId: guide.id,
        targetRole: 'guide',
        type: 'bid',
        title: `🏷️ Custom Offer: $${offer.offeredPriceUSD} USD`,
        message: `${offer.travelerName} requested a tour offer at $${offer.offeredPriceUSD} USD for "${offer.tourTitle}".`,
        icon: 'handshake',
        actionUrl: '/guide',
        postId: offer.postId,
        negotiationId: offer.id,
        senderName: offer.travelerName,
        amountUSD: offer.offeredPriceUSD
      });
    }

    res.json({ offer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/negotiations/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, counterPriceUSD, message, senderRole } = req.body;

    const offer = await dbFindNegotiationById(id);
    if (!offer) return res.status(404).json({ error: 'Negotiation offer not found' });

    if (senderRole === 'guide') {
      const guide = await dbFindGuideById(offer.guideId);
      if (guide && !guide.verified && guide.kycStatus !== 'verified') {
        return res.status(403).json({
          error: 'License verification required. Unverified tour guides cannot accept or counter offers until approved.'
        });
      }
    }

    if (action === 'accept') {
      offer.status = 'accepted';
      offer.lastSenderRole = senderRole || 'traveler';
      offer.messages.push({
        senderRole: senderRole || 'traveler',
        text: message || `Accepted offer at $${offer.offeredPriceUSD} USD! Creating booking now.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      await dbSaveNegotiation(offer);

      let scheduledTimeStr = 'As Agreed in Chat';
      if (offer.selectedSlot && offer.selectedSlot.dateStr) {
        scheduledTimeStr = `${offer.selectedSlot.dateStr} (${offer.selectedSlot.startTime} - ${offer.selectedSlot.endTime})`;
      } else if (offer.postId) {
        const post = await dbFindPostById(offer.postId);
        if (post && post.preferredDate) {
          scheduledTimeStr = post.preferredDate;
        }
      }

      const newBooking = {
        id: 'bk_' + Date.now(),
        bookingType: offer.postId ? 'negotiated_post' : 'scheduled',
        travelerId: offer.travelerId,
        travelerName: offer.travelerName,
        travelerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        guideId: offer.guideId,
        guideName: offer.guideName,
        guideAvatar: offer.guideAvatar,
        guidePhone: '+84 908 123 456',
        tourTitle: offer.tourTitle || (offer.postId ? `Custom Negotiated Tour ($${offer.offeredPriceUSD})` : 'Private Negotiated Guide Tour'),
        pickupLocation: 'Traveler Hotel / Agreed Meeting Spot',
        transportMode: 'scooter',
        groupSize: offer.groupSize || 1,
        totalPriceUSD: offer.offeredPriceUSD,
        scheduledTime: scheduledTimeStr,
        status: 'matched',
        createdAt: new Date().toISOString(),
        pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
        postId: offer.postId,
        negotiationId: offer.id,
        paymentStatus: 'held_in_escrow',
        travelerConfirmedCompletion: false,
        guideConfirmedCompletion: false,
        escrowHoldTxId: 'ESCROW_TX_' + Date.now()
      };

      await dbSaveBooking(newBooking);

      if (offer.postId) {
        const post = await dbFindPostById(offer.postId);
        if (post) {
          post.status = 'booked';
          if (post.depositStatus === 'paid_in_escrow') {
            post.depositStatus = 'transferred_to_booking';
            if (post.depositTxId) {
              newBooking.escrowHoldTxId = post.depositTxId;
            }
          }
          await dbSavePost(post);
        }

        // Close other pending negotiations for this post to avoid multi-accept conflicts
        const allPostNegs = await dbGetNegotiationsByUser(offer.travelerId);
        for (const otherNeg of allPostNegs) {
          if (otherNeg.postId === offer.postId && otherNeg.id !== offer.id && otherNeg.status !== 'accepted') {
            otherNeg.status = 'declined';
            otherNeg.messages.push({
              senderRole: 'system',
              text: 'Offer closed: Traveler accepted another guide proposal for this request.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            await dbSaveNegotiation(otherNeg);
          }
        }
      }

      // Send in-app notification to Guide
      await sendInAppNotification({
        userId: offer.guideId,
        targetRole: 'guide',
        type: 'accept',
        title: '🎉 Offer Accepted & Tour Booked!',
        message: `${offer.travelerName} accepted your offer for "${offer.tourTitle}" ($${offer.offeredPriceUSD} USD). Funds are secured in Escrow.`,
        icon: 'check_circle',
        actionUrl: '/guide',
        bookingId: newBooking.id,
        senderName: offer.travelerName,
        amountUSD: offer.offeredPriceUSD
      });

      // Send in-app notification to Traveler
      await sendInAppNotification({
        userId: offer.travelerId,
        targetRole: 'traveler',
        type: 'accept',
        title: '🎉 Tour Booking Confirmed!',
        message: `Booking for "${offer.tourTitle}" with Guide ${offer.guideName} is confirmed. Safety PIN: ${newBooking.pinCode}. Escrow deposit secured.`,
        icon: 'confirmation_number',
        actionUrl: '/traveler',
        bookingId: newBooking.id,
        senderName: offer.guideName,
        amountUSD: offer.offeredPriceUSD
      });

      return res.json({ offer, booking: newBooking });

    } else if (action === 'counter') {
      offer.status = 'countered';
      offer.offeredPriceUSD = Number(counterPriceUSD) || offer.offeredPriceUSD;
      offer.lastSenderRole = senderRole || 'traveler';
      offer.messages.push({
        senderRole: senderRole || 'traveler',
        text: message || `Counter-offered $${offer.offeredPriceUSD} USD`,
        priceUSD: offer.offeredPriceUSD,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      await dbSaveNegotiation(offer);

      if (senderRole === 'guide') {
        await sendInAppNotification({
          userId: offer.travelerId,
          targetRole: 'traveler',
          type: 'counter',
          title: `⚖️ Counter-Offer: $${offer.offeredPriceUSD} USD`,
          message: `Guide ${offer.guideName} countered with $${offer.offeredPriceUSD} USD for "${offer.tourTitle}".`,
          icon: 'price_change',
          actionUrl: '/traveler',
          negotiationId: offer.id,
          senderName: offer.guideName,
          amountUSD: offer.offeredPriceUSD
        });
      } else {
        await sendInAppNotification({
          userId: offer.guideId,
          targetRole: 'guide',
          type: 'counter',
          title: `⚖️ Counter-Offer: $${offer.offeredPriceUSD} USD`,
          message: `${offer.travelerName} countered with $${offer.offeredPriceUSD} USD for "${offer.tourTitle}".`,
          icon: 'price_change',
          actionUrl: '/guide',
          negotiationId: offer.id,
          senderName: offer.travelerName,
          amountUSD: offer.offeredPriceUSD
        });
      }

    } else if (action === 'decline') {
      offer.status = 'declined';
      await dbSaveNegotiation(offer);

      const targetId = senderRole === 'guide' ? offer.travelerId : offer.guideId;
      const targetRole = senderRole === 'guide' ? 'traveler' : 'guide';
      await sendInAppNotification({
        userId: targetId,
        targetRole,
        type: 'system',
        title: '❌ Offer Declined',
        message: `The proposal for "${offer.tourTitle}" was declined.`,
        icon: 'cancel',
        actionUrl: targetRole === 'guide' ? '/guide' : '/traveler',
        negotiationId: offer.id
      });
    }

    res.json({ offer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/negotiations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await dbGetNegotiationsByUser(userId);
    res.json({ negotiations: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await dbGetBookingsByUser(userId);
    res.json({ bookings: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let booking = await dbFindBookingById(id);
    if (!booking) {
      const all = await dbGetAllBookings();
      booking = all.find((b: any) => b.id === id);
    }
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ booking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body?.status || req.body?.newStatus;
    const role = req.body?.role; // 'traveler' | 'guide'

    if (!status) {
      return res.status(400).json({ error: 'Missing status in request body' });
    }

    let booking: any = await dbFindBookingById(id);
    if (!booking) {
      const allBookings = await dbGetAllBookings();
      booking = allBookings.find((b: any) => b.id === id);
    }

    if (!booking) {
      booking = {
        id,
        bookingType: 'negotiated_post',
        tourTitle: 'Tour Booking',
        status: status,
        paymentStatus: 'held_in_escrow',
        createdAt: new Date().toISOString()
      };
    }

    if (status === 'completed') {
      // Dual-confirmation escrow model: record the requesting role's side
      if (role === 'guide') {
        booking.guideConfirmedCompletion = true;
      } else if (role === 'traveler') {
        booking.travelerConfirmedCompletion = true;
      } else {
        // Default to guide if role not specified in body
        booking.guideConfirmedCompletion = true;
      }

      const isBothConfirmed = Boolean(booking.travelerConfirmedCompletion && booking.guideConfirmedCompletion);

      booking.status = 'completed';

      if (isBothConfirmed) {
        booking.paymentStatus = 'released';
        booking.escrowReleasedAt = new Date().toISOString();

        if (booking.guideId) {
          await sendInAppNotification({
            userId: booking.guideId,
            targetRole: 'guide',
            type: 'payout',
            title: `💰 Escrow Payout Released (+$${booking.totalPriceUSD || 0} USD)`,
            message: `Dual confirmation complete! Escrow funds for "${booking.tourTitle}" have been released to your account.`,
            icon: 'payments',
            actionUrl: '/guide',
            bookingId: booking.id,
            amountUSD: booking.totalPriceUSD
          });
        }
      } else {
        booking.paymentStatus = 'held_in_escrow';
      }
    } else {
      booking.status = status;
    }

    await dbSaveBooking(booking);

    // Notify traveler on live status change
    if (booking.travelerId && ['en_route', 'in_progress'].includes(status)) {
      await sendInAppNotification({
        userId: booking.travelerId,
        targetRole: 'traveler',
        type: 'booking',
        title: `📍 Tour Status: ${status === 'en_route' ? 'Guide En Route' : 'Tour In Progress'}`,
        message: `Your guide is ${status === 'en_route' ? 'heading to your pickup spot' : 'now conducting the tour with you'}.`,
        icon: 'near_me',
        actionUrl: '/traveler',
        bookingId: booking.id
      });
    }

    res.json({ booking });
  } catch (err: any) {
    console.error('API /api/bookings/:id/status error:', err);
    res.status(500).json({ error: err.message || 'Failed to update booking status' });
  }
});

app.post('/api/bookings/:id/confirm-completion', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'traveler' | 'guide'

    let booking: any = await dbFindBookingById(id);
    if (!booking) {
      const allBookings = await dbGetAllBookings();
      booking = allBookings.find((b: any) => b.id === id);
    }
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (role === 'traveler') {
      booking.travelerConfirmedCompletion = true;
    } else if (role === 'guide') {
      booking.guideConfirmedCompletion = true;
    } else {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check dual confirmation condition
    const isBothConfirmed = Boolean(booking.travelerConfirmedCompletion && booking.guideConfirmedCompletion);

    if (isBothConfirmed) {
      booking.status = 'completed';
      booking.paymentStatus = 'released';
      booking.escrowReleasedAt = new Date().toISOString();

      // Dual acceptance released funds to guide
      await sendInAppNotification({
        userId: booking.guideId,
        targetRole: 'guide',
        type: 'payout',
        title: `💰 Escrow Payout Released (+$${booking.totalPriceUSD} USD)`,
        message: `Dual confirmation complete! $${booking.totalPriceUSD} USD for "${booking.tourTitle}" has been transferred to your connected bank account.`,
        icon: 'payments',
        actionUrl: '/guide',
        bookingId: booking.id,
        amountUSD: booking.totalPriceUSD
      });

      await sendInAppNotification({
        userId: booking.travelerId,
        targetRole: 'traveler',
        type: 'escrow',
        title: `🌟 Tour Completed Successfully!`,
        message: `Thank you for exploring Vietnam with Guide ${booking.guideName}! "${booking.tourTitle}" has been settled.`,
        icon: 'star',
        actionUrl: '/traveler',
        bookingId: booking.id
      });

    } else {
      booking.status = 'completed';
      if (!booking.paymentStatus || booking.paymentStatus === 'held_in_escrow') {
        booking.paymentStatus = 'held_in_escrow';
      }

      // Notify counterparty to confirm completion
      if (role === 'traveler') {
        await sendInAppNotification({
          userId: booking.guideId,
          targetRole: 'guide',
          type: 'escrow',
          title: `🏁 Traveler Confirmed Tour Completion`,
          message: `${booking.travelerName || 'Traveler'} verified tour completion for "${booking.tourTitle}". Confirm now to unlock your escrow funds!`,
          icon: 'task_alt',
          actionUrl: '/guide',
          bookingId: booking.id
        });
      } else {
        await sendInAppNotification({
          userId: booking.travelerId,
          targetRole: 'traveler',
          type: 'escrow',
          title: `🏁 Guide Confirmed Tour Completion`,
          message: `Guide ${booking.guideName || 'Tour Guide'} marked "${booking.tourTitle}" as finished. Please tap to confirm and release funds.`,
          icon: 'task_alt',
          actionUrl: '/traveler',
          bookingId: booking.id
        });
      }
    }

    await dbSaveBooking(booking);
    res.json({
      booking,
      released: isBothConfirmed,
      message: isBothConfirmed
        ? 'Dual acceptance confirmed! Funds successfully released from escrow to guide.'
        : `Confirmed by ${role}. Waiting for ${role === 'traveler' ? 'guide' : 'traveler'} confirmation to release funds from escrow.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/bookings/:id/escrow-action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'force_release' | 'refund'

    const booking: any = await dbFindBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (action === 'force_release') {
      booking.travelerConfirmedCompletion = true;
      booking.guideConfirmedCompletion = true;
      booking.status = 'completed';
      booking.paymentStatus = 'released';
      booking.escrowReleasedAt = new Date().toISOString();

      await sendInAppNotification({
        userId: booking.guideId,
        targetRole: 'guide',
        type: 'payout',
        title: `💰 Escrow Released by Admin (+$${booking.totalPriceUSD} USD)`,
        message: `Admin verified and released escrow payout of $${booking.totalPriceUSD} USD for "${booking.tourTitle}".`,
        icon: 'payments',
        actionUrl: '/guide',
        bookingId: booking.id,
        amountUSD: booking.totalPriceUSD
      });

      await sendInAppNotification({
        userId: booking.travelerId,
        targetRole: 'traveler',
        type: 'escrow',
        title: `🛡️ Tour Escrow Settled by Admin`,
        message: `Booking #${booking.id.toUpperCase()} has been settled by platform administration.`,
        icon: 'verified',
        actionUrl: '/traveler',
        bookingId: booking.id
      });

    } else if (action === 'refund') {
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';

      await sendInAppNotification({
        userId: booking.travelerId,
        targetRole: 'traveler',
        type: 'escrow',
        title: `💸 Full Refund Issued ($${booking.totalPriceUSD} USD)`,
        message: `Escrow funds for "${booking.tourTitle}" have been refunded to your payment method.`,
        icon: 'replay',
        actionUrl: '/traveler',
        bookingId: booking.id,
        amountUSD: booking.totalPriceUSD
      });
    } else {
      return res.status(400).json({ error: 'Invalid action specified' });
    }

    await dbSaveBooking(booking);
    res.json({ booking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/escrow-summary', async (req, res) => {
  try {
    const allBookings = await dbGetAllBookings();

    let totalHeldUSD = 0;
    let totalReleasedUSD = 0;
    let totalRefundedUSD = 0;

    allBookings.forEach((b: any) => {
      const price = b.totalPriceUSD || 0;
      if (b.paymentStatus === 'released') {
        totalReleasedUSD += price;
      } else if (b.paymentStatus === 'refunded') {
        totalRefundedUSD += price;
      } else {
        totalHeldUSD += price;
      }
    });

    res.json({
      totalHeldUSD,
      totalReleasedUSD,
      totalRefundedUSD,
      totalBookings: allBookings.length,
      bookings: allBookings
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/guides/toggle-status', async (req, res) => {
  try {
    const { guideId, isOnline } = req.body;
    const guide = await dbFindGuideById(guideId);
    if (!guide) return res.status(404).json({ error: 'Guide profile not found' });
    guide.isOnline = isOnline;
    await dbSaveGuide(guide);
    res.json({ guide });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/scheduled', async (req, res) => {
  try {
    const { travelerId, travelerName, travelerAvatar, tourId, scheduledTime, groupSize } = req.body;
    const tour = await dbFindTourById(tourId);
    if (!tour) return res.status(404).json({ error: 'Tour package not found' });

    const newBooking = {
      id: 'bk_' + Date.now(),
      bookingType: 'scheduled',
      travelerId: travelerId || 'u_traveler_1',
      travelerName: travelerName || 'Sarah Jenkins',
      travelerAvatar: travelerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      guideId: tour.guideId,
      guideName: tour.guideName,
      guideAvatar: tour.guideAvatar,
      guidePhone: '+84 908 123 456',
      tourTitle: tour.title,
      pickupLocation: `${tour.city} Center / Hotel Pickup`,
      transportMode: 'scooter',
      groupSize: Number(groupSize) || 1,
      totalPriceUSD: (tour.priceUSDPerPerson || 30) * (Number(groupSize) || 1),
      scheduledTime: scheduledTime || 'Tomorrow at 09:00 AM',
      status: 'matched',
      createdAt: new Date().toISOString(),
      pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
      paymentStatus: 'held_in_escrow',
      travelerConfirmedCompletion: false,
      guideConfirmedCompletion: false,
      escrowHoldTxId: 'ESCROW_TX_' + Date.now()
    };

    await dbSaveBooking(newBooking);

    // Notify Guide
    await sendInAppNotification({
      userId: newBooking.guideId,
      targetRole: 'guide',
      type: 'booking',
      title: '🚀 New Scheduled Tour Booking!',
      message: `${newBooking.travelerName} booked "${newBooking.tourTitle}" ($${newBooking.totalPriceUSD} USD) for ${newBooking.scheduledTime}.`,
      icon: 'airplane_ticket',
      actionUrl: '/guide',
      bookingId: newBooking.id,
      senderName: newBooking.travelerName,
      senderAvatar: newBooking.travelerAvatar,
      amountUSD: newBooking.totalPriceUSD
    });

    // Notify Traveler
    await sendInAppNotification({
      userId: newBooking.travelerId,
      targetRole: 'traveler',
      type: 'booking',
      title: '✅ Tour Booked & Escrow Secured',
      message: `Booking for "${newBooking.tourTitle}" with Guide ${newBooking.guideName} is confirmed! Safety PIN: ${newBooking.pinCode}.`,
      icon: 'shield_lock',
      actionUrl: '/traveler',
      bookingId: newBooking.id,
      senderName: newBooking.guideName,
      senderAvatar: newBooking.guideAvatar,
      amountUSD: newBooking.totalPriceUSD
    });

    res.json({ booking: newBooking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings/instant', async (req, res) => {
  try {
    const { travelerId, travelerName, travelerAvatar, pickupLocation, transportMode, durationHours } = req.body;

    let guide = await dbGetOnlineGuide();

    const guideHourly = guide ? guide.hourlyRateUSD : 20;
    const duration = Number(durationHours) || 2;
    const totalPriceUSD = guideHourly * duration;

    const newBooking = {
      id: 'bk_' + Date.now(),
      bookingType: 'instant',
      travelerId: travelerId || 'u_traveler_1',
      travelerName: travelerName || 'Sarah Jenkins',
      travelerAvatar: travelerAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      guideId: guide ? guide.id : 'g_1',
      guideName: guide ? guide.fullName : 'Minh Nguyen',
      guideAvatar: guide ? guide.avatar : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      guidePhone: '+84 908 123 456',
      tourTitle: `Instant On-Demand Guide (${(transportMode || 'scooter').toUpperCase()})`,
      pickupLocation: pickupLocation || 'Ben Thanh Market, District 1, HCMC',
      transportMode: transportMode || 'scooter',
      groupSize: 1,
      totalPriceUSD,
      scheduledTime: 'Immediate Dispatch (NOW)',
      status: 'en_route',
      createdAt: new Date().toISOString(),
      pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
      paymentStatus: 'held_in_escrow',
      travelerConfirmedCompletion: false,
      guideConfirmedCompletion: false,
      escrowHoldTxId: 'ESCROW_TX_' + Date.now()
    };

    await dbSaveBooking(newBooking);

    // Notify Guide
    await sendInAppNotification({
      userId: newBooking.guideId,
      targetRole: 'guide',
      type: 'booking',
      title: '⚡ Instant On-Demand Guide Requested!',
      message: `${newBooking.travelerName} requested immediate dispatch at ${newBooking.pickupLocation}. Total: $${newBooking.totalPriceUSD} USD.`,
      icon: 'bolt',
      actionUrl: '/guide',
      bookingId: newBooking.id,
      senderName: newBooking.travelerName,
      senderAvatar: newBooking.travelerAvatar,
      amountUSD: newBooking.totalPriceUSD
    });

    // Notify Traveler
    await sendInAppNotification({
      userId: newBooking.travelerId,
      targetRole: 'traveler',
      type: 'booking',
      title: '🛵 Guide Dispatched & En Route!',
      message: `Guide ${newBooking.guideName} has been assigned and is heading to your pickup location. PIN: ${newBooking.pinCode}.`,
      icon: 'near_me',
      actionUrl: '/traveler',
      bookingId: newBooking.id,
      senderName: newBooking.guideName,
      senderAvatar: newBooking.guideAvatar,
      amountUSD: newBooking.totalPriceUSD
    });

    res.json({ booking: newBooking, guide });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chat/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const messages = await dbGetChatMessages(bookingId);

    if (messages.length === 0) {
      const defaultWelcome = {
        id: 'msg_welcome_' + Date.now(),
        bookingId,
        senderId: 'system',
        senderName: 'Tour Guide Hub Assistant',
        senderRole: 'admin',
        text: 'Live chat active! Your local guide has been notified and is en-route.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      return res.json({ messages: [defaultWelcome] });
    }

    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { senderId, senderName, senderRole, text } = req.body;

    const newMsg = {
      id: 'msg_' + Date.now(),
      bookingId,
      senderId: senderId || 'u_1',
      senderName: senderName || 'User',
      senderRole: senderRole || 'traveler',
      text: text || '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await dbSaveChatMessage(newMsg);

    // Find booking to determine recipient
    const allBookings = await dbGetAllBookings();
    const bk = allBookings.find((b: any) => b.id === bookingId);

    if (bk) {
      if (senderRole === 'traveler') {
        await sendInAppNotification({
          userId: bk.guideId,
          targetRole: 'guide',
          type: 'chat',
          title: `💬 ${newMsg.senderName}`,
          message: newMsg.text.length > 80 ? newMsg.text.slice(0, 77) + '...' : newMsg.text,
          icon: 'chat',
          actionUrl: '/guide',
          bookingId,
          senderName: newMsg.senderName
        });
      } else if (senderRole === 'guide') {
        await sendInAppNotification({
          userId: bk.travelerId,
          targetRole: 'traveler',
          type: 'chat',
          title: `💬 Guide ${newMsg.senderName}`,
          message: newMsg.text.length > 80 ? newMsg.text.slice(0, 77) + '...' : newMsg.text,
          icon: 'chat',
          actionUrl: '/traveler',
          bookingId,
          senderName: newMsg.senderName
        });
      }
    }

    res.json({ message: newMsg });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/recommend-itinerary', async (req, res) => {
  try {
    const { city, durationDays, interests, budget } = req.body;

    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are an expert local guide in ${city}. Create a detailed ${durationDays}-day travel itinerary for a traveler interested in ${Array.isArray(interests) ? interests.join(', ') : 'culture, food'}. Budget style: ${budget || 'balanced'}. Return a friendly summary response with title, days breakdown, highlight spots, and local food tips.`,
        });

        const responseText = response.text || '';
        res.json({ 
          itinerary: {
            city: city || 'Ho Chi Minh City',
            durationDays: durationDays || 1,
            summary: responseText || `Custom ${durationDays}-day curated tour in ${city}!`,
            recommendations: responseText
          } 
        });
        return;
      } catch (aiErr) {
        console.warn('Gemini AI generateContent fallback:', aiErr);
      }
    }

    res.json({
      itinerary: {
        city: city || 'Ho Chi Minh City',
        durationDays: durationDays || 1,
        summary: `Custom ${durationDays}-day curated itinerary for ${city}!`,
        recommendations: `Day 1: Start morning at local coffee spot, explore historic heritage sites, lunch at famous street food alley, afternoon scooter ride, and evening night market tour.`
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== IN-APP NOTIFICATIONS API ====================

app.get('/api/notifications', async (req, res) => {
  try {
    const { userId, role } = req.query;
    const notifications = await dbGetNotifications(userId as string, role as string);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/create', async (req, res) => {
  try {
    const { userId, targetRole, type, title, message, icon, actionUrl, bookingId, postId, negotiationId, senderName, senderAvatar, amountUSD } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    const notif = await sendInAppNotification({
      userId: userId || 'all',
      targetRole: targetRole || 'all',
      type: type || 'system',
      title,
      message,
      icon,
      actionUrl,
      bookingId,
      postId,
      negotiationId,
      senderName,
      senderAvatar,
      amountUSD
    });
    res.json({ notification: notif });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await dbMarkNotificationAsRead(id);
    res.json({ success: true, notification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { userId, role } = req.body;
    await dbMarkAllNotificationsAsRead(userId, role);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/clear', async (req, res) => {
  try {
    const { userId, role } = req.body;
    await dbClearNotifications(userId, role);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route for unhandled /api/* endpoints to guarantee JSON response instead of HTML fallback
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ==================== VITE & SERVING CONFIGURATION ====================

async function startServer() {
  // Connect to Firebase Firestore database (or fallback store)
  await initFirebaseDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Tour Guide Hub Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
