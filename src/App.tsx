import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Homepage } from './components/Homepage';
import { AdminDashboard } from './modules/admin/AdminDashboard';
import { GuideDashboard } from './modules/guide/GuideDashboard';
import { TravelerDashboard } from './modules/traveler/TravelerDashboard';
import { AuthModal } from './components/AuthModal';
import { ExportRepoModal } from './components/ExportRepoModal';
import { LiveBookingTrackerModal } from './components/LiveBookingTrackerModal';
import { AITourPlannerModal } from './components/AITourPlannerModal';
import { Language, getDefaultLanguage } from './lib/translations';
import { 
  User, 
  GuideProfile, 
  GuideBankAccount,
  TourPackage, 
  TourBooking, 
  KYCApplication, 
  TravelerPostRequest, 
  NegotiationOffer,
  ScheduleSlot,
  AdminSystemStats
} from './types';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Localization State initialized with browser default locale
  const [language, setLanguage] = useState<Language>(() => getDefaultLanguage());

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    try {
      return localStorage.getItem('app_selected_city') || 'All';
    } catch {
      return 'All';
    }
  });

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    try {
      localStorage.setItem('app_selected_city', city);
    } catch {
      // Ignore localStorage write errors
    }
  };

  // Default to normal guest/unauthenticated state (not logged in)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data Stores
  const [stats, setStats] = useState<AdminSystemStats>({
    totalUsers: 4,
    totalGuides: 2,
    totalTravelers: 1,
    totalPendingKYC: 1,
    totalActivePosts: 1,
    totalTours: 1,
    totalBookings: 1,
    totalRevenueUSD: 55
  });

  const [kycList, setKycList] = useState<KYCApplication[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [posts, setPosts] = useState<TravelerPostRequest[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationOffer[]>([]);
  const [bookings, setBookings] = useState<TourBooking[]>([]);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isExportRepoOpen, setIsExportRepoOpen] = useState<boolean>(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState<boolean>(false);
  const [isAITourPlannerOpen, setIsAITourPlannerOpen] = useState<boolean>(false);

  // Safe fetch helper to handle non-JSON / HTML responses gracefully
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return {};
    } catch (err) {
      console.warn(`Safe fetch warning for ${url}:`, err);
      return {};
    }
  };

  const fetchAllData = async (overrideUser?: User | null) => {
    try {
      const activeUser = overrideUser !== undefined ? overrideUser : currentUser;

      // 1. Admin stats, KYC list, & User list
      const dataUsers = await safeFetchJson('/api/admin/users');
      if (dataUsers.users) setUsersList(dataUsers.users);

      const dataStats = await safeFetchJson('/api/admin/stats');
      if (dataStats.stats) setStats(dataStats.stats);

      const dataKyc = await safeFetchJson('/api/admin/kyc-list');
      if (dataKyc.kycList) setKycList(dataKyc.kycList);

      // 2. Guides & Tours
      const dataGuides = await safeFetchJson('/api/guides');
      if (dataGuides.guides) setGuides(dataGuides.guides);

      const dataTours = await safeFetchJson(`/api/tours?city=${encodeURIComponent(selectedCity)}`);
      if (dataTours.tours) setTours(dataTours.tours);

      // 3. Traveler Posts
      const dataPosts = await safeFetchJson(`/api/traveler/posts?city=${encodeURIComponent(selectedCity)}`);
      if (dataPosts.posts) setPosts(dataPosts.posts);

      // 4. Negotiations & Bookings
      const dataNeg = await safeFetchJson(`/api/negotiations/user/all`);
      if (dataNeg.negotiations) setNegotiations(dataNeg.negotiations);

      const dataBookings = await safeFetchJson(`/api/bookings/user/all`);
      if (dataBookings.bookings) setBookings(dataBookings.bookings);

    } catch (err) {
      console.error('Data sync error:', err);
    }
  };

  // Fetch initial data & re-fetch on city or user change
  useEffect(() => {
    fetchAllData();
  }, [selectedCity, currentUser?.id]);

  // Language change handler
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {
      // Ignore localStorage write errors
    }
  };

  // Auth Handlers
  const handleAuthenticated = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    fetchAllData(user);
    if (user.role === 'traveler') navigate('/traveler');
    else if (user.role === 'guide') navigate('/guide');
    else if (user.role === 'admin') navigate('/admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    fetchAllData(null);
    navigate('/');
  };

  // Verify session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      safeFetchJson('/api/auth/verify-token', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      })
      .then(data => {
        if (data && data.verified && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.warn('Token verify check:', err));
    }
  }, []);

  // Admin Actions
  const handleReviewKYC = async (id: string, action: 'approve' | 'reject', reason?: string, instructions?: string) => {
    try {
      const res = await fetch(`/api/admin/kyc/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason, declineInstructions: instructions })
      });
      const data = await res.json();
      if (data.application) {
        setKycList(kycList.map(k => k.id === id ? data.application : k));
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (userId: string, status: 'active' | 'suspended') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.user) {
        setUsersList(usersList.map(u => u.id === userId ? data.user : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tourist Guide Actions
  const handleSubmitKYC = async (payload: {
    cardNumber: string;
    issuingAuthority: string;
    expiryDate: string;
    cardImageUrl: string;
    cccdNumber: string;
    cccdFrontUrl: string;
    cccdBackUrl: string;
    facePhotoUrl: string;
    tourGuideCardUrl: string;
    agreedToTerms: boolean;
  }) => {
    try {
      const guideId = currentGuideProfile?.id || (currentUser ? 'g_' + currentUser.id : 'g_1');
      const res = await fetch('/api/guide/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId,
          guideUserId: currentUser?.id,
          guideName: currentUser?.name || currentGuideProfile?.fullName,
          guideAvatar: currentUser?.avatar || currentGuideProfile?.avatar,
          ...payload
        })
      });
      const data = await res.json();
      if (data.kycApplication) {
        setKycList([data.kycApplication, ...kycList]);
        if (data.guide && currentUser && currentUser.role === 'guide') {
          const updatedUser = {
            ...currentUser,
            guideProfile: data.guide
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGuideBankAccount = async (bankAccount: GuideBankAccount) => {
    try {
      const guideId = currentGuideProfile?.id || (currentUser ? 'g_' + currentUser.id : 'g_1');
      const res = await fetch(`/api/guide/${guideId}/bank-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bankAccount, userId: currentUser?.id })
      });
      const data = await res.json();
      if (data.guide && currentUser && currentUser.role === 'guide') {
        const updatedUser = {
          ...currentUser,
          guideProfile: data.guide
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to save guide bank account:', err);
    }
  };

  const handleCreateTour = async (tourData: any) => {
    try {
      const payload = {
        ...tourData,
        guideId: currentGuideProfile?.id || (currentUser?.role === 'guide' ? 'g_' + currentUser.id : 'g_1'),
        guideUserId: currentUser?.id,
        guideName: currentGuideProfile?.fullName || currentUser?.name || 'Local Guide',
        guideAvatar: currentGuideProfile?.avatar || currentUser?.avatar
      };
      const res = await fetch('/api/tours/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.tour) {
        setTours(prev => [data.tour, ...prev]);
        fetchAllData();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTour = async (tourData: any) => {
    try {
      const res = await fetch('/api/tours/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tourData)
      });
      const data = await res.json();
      if (data.tour) {
        setTours(tours.map(t => t.id === data.tour.id ? data.tour : t));
        fetchAllData();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleGuideStatus = async (guideId: string, isOnline: boolean) => {
    try {
      const res = await fetch('/api/guides/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, isOnline })
      });
      const data = await res.json();
      if (data.guide) {
        setGuides(guides.map(g => g.id === guideId ? data.guide : g));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Traveler & Negotiation Actions
  const handleCreateTravelerPost = async (postData: any) => {
    try {
      const res = await fetch('/api/traveler/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      const data = await res.json();
      if (data.post) {
        setPosts(prev => [data.post, ...prev.filter(p => p.id !== data.post.id)]);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseTravelerPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/traveler/posts/${postId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.post) {
        setPosts(prev => prev.map(p => p.id === postId ? data.post : p));
        fetchAllData();
      }
    } catch (err) {
      console.error('Error closing traveler post:', err);
    }
  };

  const handleUpdateTravelerPostStatus = async (postId: string, status: 'open' | 'negotiating' | 'booked' | 'closed') => {
    try {
      const res = await fetch(`/api/traveler/posts/${postId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.post) {
        setPosts(prev => prev.map(p => p.id === postId ? data.post : p));
        fetchAllData();
      }
    } catch (err) {
      console.error('Error updating traveler post status:', err);
    }
  };

  const handleSendBidToPost = async (postId: string, offerPrice: number, message: string) => {
    try {
      const targetPost = posts.find(p => String(p.id) === String(postId));
      const targetSlot = targetPost?.scheduleSlots?.[0] || (targetPost?.preferredDate ? { dateStr: targetPost.preferredDate, startTime: '08:30 AM', endTime: '12:30 PM' } : undefined);
      const res = await fetch('/api/negotiations/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          travelerId: targetPost?.travelerId,
          travelerName: targetPost?.travelerName,
          tourTitle: targetPost?.title,
          guideId: currentGuideProfile ? currentGuideProfile.id : (currentUser?.role === 'guide' ? 'g_' + currentUser.id : 'g_1'),
          guideUserId: currentUser?.id,
          guideName: currentGuideProfile?.fullName || currentUser?.name || 'Local Guide',
          guideAvatar: currentGuideProfile?.avatar || currentUser?.avatar,
          offeredPriceUSD: offerPrice,
          originalPriceUSD: targetPost?.maxBudgetUSD || offerPrice,
          selectedSlot: targetSlot,
          groupSize: targetPost?.groupSize || 1,
          message,
          senderRole: 'guide'
        })
      });
      const data = await res.json();
      if (data.offer) {
        setNegotiations(prev => [data.offer, ...prev.filter(n => n.id !== data.offer.id)]);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNegotiateWithGuide = async (
    guide: GuideProfile,
    offeredPriceUSD: number,
    message: string,
    tourId?: string,
    tourTitle?: string,
    selectedSlot?: ScheduleSlot,
    groupSize?: number,
    originalPriceUSD?: number
  ) => {
    try {
      if (!currentUser) {
        setIsAuthOpen(true);
        return;
      }
      const res = await fetch('/api/negotiations/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerId: currentUser.id,
          travelerName: currentUser.name,
          travelerEmail: currentUser.email,
          travelerAvatar: currentUser.avatar,
          guideId: guide.id,
          guideName: guide.fullName,
          guideAvatar: guide.avatar,
          tourId,
          tourTitle,
          selectedSlot,
          groupSize,
          offeredPriceUSD,
          originalPriceUSD: originalPriceUSD || offeredPriceUSD,
          message,
          senderRole: 'traveler'
        })
      });
      const data = await res.json();
      if (data.offer) {
        setNegotiations(prev => [data.offer, ...prev.filter(n => n.id !== data.offer.id)]);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespondNegotiation = async (
    offerId: string, 
    action: 'accept' | 'counter' | 'decline', 
    counterPrice?: number, 
    message?: string,
    explicitSenderRole?: 'traveler' | 'guide'
  ) => {
    const senderRole = explicitSenderRole || (currentUser?.role === 'guide' ? 'guide' : 'traveler');
    try {
      const res = await fetch(`/api/negotiations/${offerId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          counterPriceUSD: counterPrice,
          message,
          senderRole
        })
      });
      const data = await res.json();
      if (res.ok && data.offer) {
        setNegotiations(prev => prev.map(n => n.id === offerId ? data.offer : n));
        if (data.booking) {
          setBookings(prev => [data.booking, ...prev.filter(b => b.id !== data.booking.id)]);
        }
        fetchAllData();
      } else if (data.error) {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'in_progress' } : b));
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      });
      const data = await res.json();
      if (data.booking) {
        setBookings(prev => prev.map(b => b.id === bookingId ? data.booking : b));
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmCompletion = async (bookingId: string, role: 'traveler' | 'guide') => {
    try {
      // Optimistically update only the confirming role's completion state
      setBookings(prev => prev.map(b => {
        if (b.id !== bookingId) return b;
        const updated = { ...b };
        if (role === 'guide') updated.guideConfirmedCompletion = true;
        if (role === 'traveler') updated.travelerConfirmedCompletion = true;
        if (updated.guideConfirmedCompletion && updated.travelerConfirmedCompletion) {
          updated.status = 'completed';
          updated.paymentStatus = 'released';
        }
        return updated;
      }));

      const res = await fetch(`/api/bookings/${bookingId}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.booking) {
        setBookings(prev => prev.map(b => b.id === bookingId ? data.booking : b));
        fetchAllData();
      }
    } catch (err) {
      console.error('Confirm completion error:', err);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'matched' | 'en_route' | 'in_progress' | 'completed', role?: 'traveler' | 'guide') => {
    try {
      const userRole = role || (currentUser?.role === 'guide' || (typeof window !== 'undefined' && window.location.pathname.includes('/guide')) ? 'guide' : 'traveler');

      // Optimistically update React state
      setBookings(prev => prev.map(b => {
        if (b.id !== bookingId) return b;
        const updated = { ...b };
        if (status === 'completed') {
          if (userRole === 'guide') updated.guideConfirmedCompletion = true;
          if (userRole === 'traveler') updated.travelerConfirmedCompletion = true;
          if (updated.guideConfirmedCompletion && updated.travelerConfirmedCompletion) {
            updated.status = 'completed';
            updated.paymentStatus = 'released';
          }
        } else {
          updated.status = status;
        }
        return updated;
      }));

      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, role: userRole })
      });

      const data = await res.json();
      if (data.booking) {
        setBookings(prev => prev.map(b => b.id === bookingId ? data.booking : b));
        await fetchAllData();
      } else {
        console.error('Update booking status failed:', data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Update booking status error:', err);
    }
  };

  const currentGuideProfile: GuideProfile = React.useMemo(() => {
    if (currentUser?.guideProfile) {
      return currentUser.guideProfile;
    }
    const found = guides.find(
      g => g.userId === currentUser?.id || g.fullName.toLowerCase() === currentUser?.name?.toLowerCase()
    );
    if (found) {
      return {
        ...found,
        fullName: currentUser?.name || found.fullName,
        avatar: currentUser?.avatar || found.avatar
      };
    }
    if (currentUser && currentUser.role === 'guide') {
      const isKyced = currentUser.guideProfile?.kycStatus === 'verified' || currentUser.guideProfile?.verified;
      return {
        id: 'g_' + currentUser.id,
        userId: currentUser.id,
        fullName: currentUser.name,
        avatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`,
        city: selectedCity && selectedCity !== 'All' ? selectedCity : 'Ho Chi Minh City',
        rating: 5.0,
        reviewCount: 0,
        hourlyRateUSD: 25,
        languages: ['English', 'Vietnamese'],
        bio: currentUser.bio || 'Tourist Guide',
        tourTypes: ['walking', 'food', 'culture'],
        badges: isKyced ? ['Verified Guide 📜'] : ['New Guide 🌟'],
        isOnline: true,
        currentLat: 10.7769,
        currentLng: 106.7009,
        verified: !!isKyced,
        kycStatus: currentUser.guideProfile?.kycStatus || 'unsubmitted',
        completedTours: 0
      };
    }
    return guides[0] || {
      id: 'g_1',
      userId: 'u_guide_1',
      fullName: 'Nguyen Van Minh',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      city: 'Ho Chi Minh City',
      rating: 4.95,
      reviewCount: 142,
      hourlyRateUSD: 20,
      languages: ['English', 'Vietnamese', 'French'],
      bio: 'Licensed expert on history and street food tours.',
      tourTypes: ['walking', 'food'],
      badges: ['Licensed Guide 📜'],
      isOnline: true,
      currentLat: 10.7769,
      currentLng: 106.7009,
      verified: true,
      kycStatus: 'verified',
      completedTours: 238
    };
  }, [currentUser, guides, selectedCity]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      
      {/* Top Navbar with Navigation Tabs & Language Selector */}
      <HeaderNavbar
        currentUser={currentUser}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenExportRepo={() => setIsExportRepoOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAITourPlanner={() => setIsAITourPlannerOpen(true)}
        onLogout={handleLogout}
        pendingKYCCount={(kycList || []).filter(k => k.status === 'pending').length}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      {/* Main Container per Route */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Homepage
                currentUser={currentUser}
                guides={guides}
                onOpenAuth={() => setIsAuthOpen(true)}
                language={language}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
              />
            }
          />

          <Route
            path="/traveler"
            element={
              currentUser?.role === 'traveler' ? (
                <TravelerDashboard
                  currentUser={currentUser}
                  selectedCity={selectedCity}
                  onCityChange={setSelectedCity}
                  guides={guides}
                  posts={posts}
                  negotiations={negotiations}
                  bookings={bookings}
                  tours={tours}
                  onCreatePost={handleCreateTravelerPost}
                  onClosePost={handleCloseTravelerPost}
                  onUpdatePostStatus={handleUpdateTravelerPostStatus}
                  onNegotiateWithGuide={handleNegotiateWithGuide}
                  onRespondNegotiation={handleRespondNegotiation}
                  onConfirmCompletion={handleConfirmCompletion}
                  onUpdateStatus={handleUpdateBookingStatus}
                  language={language}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/guide"
            element={
              currentUser?.role === 'guide' ? (
                <GuideDashboard
                  guideProfile={currentGuideProfile}
                  bookings={bookings}
                  posts={posts}
                  negotiations={negotiations}
                  tours={tours}
                  onToggleStatus={handleToggleGuideStatus}
                  onSubmitKYC={handleSubmitKYC}
                  onCreateTour={handleCreateTour}
                  onUpdateTour={handleUpdateTour}
                  onAcceptBooking={handleAcceptBooking}
                  onSendBidToPost={handleSendBidToPost}
                  onRespondNegotiation={handleRespondNegotiation}
                  onConfirmCompletion={handleConfirmCompletion}
                  onUpdateStatus={handleUpdateBookingStatus}
                  onSaveBankAccount={handleSaveGuideBankAccount}
                  language={language}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              currentUser?.role === 'admin' ? (
                <AdminDashboard
                  stats={stats}
                  kycList={kycList}
                  users={usersList}
                  tours={tours}
                  posts={posts}
                  bookings={bookings}
                  onReviewKYC={handleReviewKYC}
                  onToggleUserStatus={handleToggleUserStatus}
                  onRefresh={fetchAllData}
                  language={language}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-teal-400">map</span>
            <span className="font-bold text-white text-sm">Tour Guide Hub</span>
            <span className="text-slate-500">• Multi-Role Platform (Admin • Guide • Traveler)</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:text-teal-400 cursor-pointer">
              Home
            </Link>
            {currentUser?.role === 'admin' && (
              <Link to="/admin" className="hover:text-amber-400 cursor-pointer">
                Admin Back-Office
              </Link>
            )}
            <span>© 2026 Tour Guide Hub</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
        language={language}
      />

      <ExportRepoModal
        isOpen={isExportRepoOpen}
        onClose={() => setIsExportRepoOpen(false)}
      />

      <LiveBookingTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        bookings={bookings}
        currentUser={currentUser}
        onUpdateStatus={handleUpdateBookingStatus}
        onConfirmCompletion={handleConfirmCompletion}
        language={language}
      />

      <AITourPlannerModal
        isOpen={isAITourPlannerOpen}
        onClose={() => setIsAITourPlannerOpen(false)}
        selectedCity={selectedCity}
        onConvertToPublicPost={(payload) => {
          handleCreateTravelerPost(payload);
        }}
      />

    </div>
  );
}
