export type Language = 'en' | 'vi';

export const translations = {
  en: {
    // Header & Navigation
    home: 'Home',
    destination: 'Destination',
    traveler: 'Traveler Portal',
    touristGuide: 'Tourist Guide Portal',
    admin: 'Admin Back-Office',
    signIn: 'Sign In / Register',
    signOut: 'Sign Out',
    googleVerified: 'Google Verified',
    welcomeVisitor: 'Guest Visitor',
    
    // Homepage
    heroBadge: 'VERIFIED LOCAL TOUR GUIDES PLATFORM • VNAT LICENSED',
    heroTitle: 'Discover Authentic Local Experiences with Verified Guides',
    heroSubtitle: 'Tour Guide Hub connects travelers with government-verified local guides for personalized tours, custom itinerary bids, and instant guide booking.',
    exploreGuidesBtn: 'Explore Local Guides',
    becomeGuideBtn: 'Apply as a Tourist Guide',
    adminAccessBtn: 'Admin Back-Office',
    statsVerifiedGuides: 'Verified Local Guides',
    statsCitiesCovered: 'Major Asian Cities',
    statsLicenseMatch: 'National Registry Match',
    statsInstantBooking: 'Instant Dispatch Available',

    // Ecosystem Cards
    ecosystemTitle: 'A Complete 3-Role Ecosystem for Local Tourism',
    ecosystemSubtitle: 'Designed for seamless interaction between travelers, certified guides, and compliance admins.',
    travelerFeatureTitle: 'For Travelers',
    travelerFeatureDesc: 'Browse verified guides by city and language, publish custom tour requests, and negotiate prices directly.',
    guideFeatureTitle: 'For Tourist Guides',
    guideFeatureDesc: 'Complete 5-step national KYC verification, list custom tours, bid on traveler requests, and earn income.',
    adminFeatureTitle: 'For Platform Admins',
    adminFeatureDesc: 'Verify license numbers on the official Ministry of Culture, Sports & Tourism portal (huongdanvien.vn) before approval.',

    // Verification Highlight
    govVerificationTitle: '100% Licensed & Government Verified Guides',
    govVerificationDesc: 'Every tour guide on Tour Guide Hub passes a rigorous 5-step identity and license verification pipeline matched against national database records.',
    checkPortalBtn: 'Learn About huongdanvien.vn Lookup',

    // Sample Guides Preview
    featuredGuidesTitle: 'Featured Local Guides in Popular Cities',
    featuredGuidesSubtitle: 'Meet top-rated local experts ready to show you hidden gems, food markets, and cultural heritage.',
    hourlyRate: 'Hourly Rate',
    viewGuideProfile: 'View Guide & Book',

    // CTA
    ctaTitle: 'Ready to Experience Authentic Local Travel?',
    ctaSubtitle: 'Sign in to create custom tour requests or join as a certified local tourist guide today.',
    getStartedTraveler: 'Get Started as Traveler',
    getStartedGuide: 'Join as Local Guide',

    // Auth Modal
    authTitleLogin: 'Sign In to Your Account',
    authTitleRegister: 'Create New Account',
    googleLoginComingSoon: 'Sign in with Google',
    googleComingSoonBadge: 'COMING SOON',
    googleLoginNotice: 'Google OAuth login is currently coming soon. Please use Email and Password authentication below.',
    emailAddress: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    selectRole: 'Select Role',
    loginBtn: 'Sign In',
    signupBtn: 'Create Account & Sign In',
    noAccountYet: "Don't have an account yet?",
    alreadyHaveAccount: 'Already have an account?',
    quickDemoLogin: 'Quick One-Click Demo Accounts',
    backendVerifiedLogin: 'Account Authentication',
    tokenPayloadValidated: 'Secure server session management',
    googleAccounts: 'Google Accounts',
    newGoogleLogin: 'New Google Login',
    selectGoogleAccount: 'Select Verified Google Account',
    googleEmailAddress: 'Google Email Address',
    googleProfileName: 'Google Profile Name',
    targetAccountRole: 'Target Account Role',
    verifyGoogleToken: 'Verify Google ID Token with Backend',
    contactingBackend: 'Authenticating with Server...',
    backendTokenActive: '🔒 Secure Password & Token Auth Active',
    
    // Roles
    roleTravelerDesc: 'Traveler (Hire Guides & Negotiate)',
    roleGuideDesc: 'Tourist Guide (License & Tour Hosting)',
    roleAdminDesc: 'Platform Admin (KYC Compliance)',

    // Traveler Card Bullet points
    travelerFeaturePoint1: 'Filter by destination city & spoken languages',
    travelerFeaturePoint2: 'Post custom tour requests & budget limits',
    travelerFeaturePoint3: 'Real-time price negotiation with guide bids',

    // Guide Card Bullet points
    guideFeaturePoint1: 'Upload CCCD, face portrait & guide card',
    guideFeaturePoint2: 'Publish custom tours or bid on traveler posts',
    guideFeaturePoint3: 'Manage online status for Grab-style requests',

    // Admin Card Bullet points
    adminFeaturePoint1: 'Direct link to huongdanvien.vn national portal',
    adminFeaturePoint2: 'Review CCCD, Face photo & card expiry match',
    adminFeaturePoint3: 'Approve or provide feedback instructions for guides',

    // National Database Integration section
    natDbIntegrationBadge: 'National Tourism Database Integration',
    cardNumVerifyTitle: 'License Card Number Verification',
    cardNumVerifyDesc: 'Card numbers are copied directly and queried against Ministry records on huongdanvien.vn.',
    fraudPrevTitle: '3-Artifact Fraud Prevention',
    fraudPrevDesc: 'Cross-verifies CCCD, live face portrait, and tour guide license card side-by-side.',

    // Live Portal Demo Window
    lookupPortalTitle: 'huongdanvien.vn • Lookup Portal',
    liveVerifiedBadge: 'LIVE VERIFIED',
    guideNameLabel: 'Guide Name:',
    licenseNumberLabel: 'License Number:',
    issuingAuthorityPortalLabel: 'Issuing Authority:',
    issuingAuthHCMC: 'Department of Tourism HCMC',
    nationalStatusLabel: 'National Status:',
    activeLicenseBadge: 'ACTIVE LICENSE',

    // Admin & KYC Guide
    officialGovPortalGuide: 'Official Government Portal License Verification Guide',
    vnatGuideLookup: 'Vietnam National Authority of Tourism (VNAT) Guide Lookup',
    vnatGuideLookupDesc: "Before approving any Tourist Guide license, Admin must verify the guide's official card status on the Ministry of Culture, Sports and Tourism registry portal.",
    step1CopyCardNum: '1. Copy License Card #',
    step1CopyCardNumDesc: 'Click "Copy Card #" from the guide application row below.',
    step2OpenPortal: '2. Open Official Portal',
    step2OpenPortalDesc: 'Open huongdanvien.vn and paste the card number into the search filter.',
    step3VerifyDecision: '3. Verify & Decision',
    step3VerifyDecisionDesc: 'Ensure CCCD, Face photo, and card expiry date match portal details before approving.',
    openPortalBtn: 'Open huongdanvien.vn Portal',
    pendingApproval: 'Pending Approval',
    guideInfo: 'Guide Info',
    licenseCardDetails: 'License Card Details',
    verificationArtifacts: '3 Verification Artifacts',
    submittedDate: 'Submitted Date',
    statusLabel: 'Status',
    adminActions: 'Admin Actions',
    viewArtifacts: 'View CCCD + Face + Card',
    approve: 'Approve',
    decline: 'Decline',
    declineGuideKYC: 'Decline Guide KYC Application',
    primaryDeclineReason: 'Primary Decline Reason',
    declineInstructionsLabel: 'Instructions for Tourist Guide (How to Fix)',
    confirmDecline: 'Confirm Decline',
    cancel: 'Cancel',

    // KYC 5-Step Pipeline Modal
    kycPipelineTitle: '5-Step Tourist Guide KYC Verification Pipeline',
    licenseAndIdentityHeader: 'License & Identity Verification',
    licenseAndIdentityDesc: 'Complete the required steps to get verified by Back-Office Admin on the national tourism portal (huongdanvien.vn).',
    step1Cccd: '1. CCCD',
    step2Face: '2. Face Photo',
    step3GuideCard: '3. Guide Card',
    step4Terms: '4. Terms',
    step5Submit: '5. Submit',
    cccdNumberLabel: 'CCCD / Passport ID Number',
    cccdFrontUrlLabel: '1. CCCD Front Side Photo URL',
    cccdBackUrlLabel: '2. CCCD Back Side Photo URL',
    facePhotoUrlLabel: 'Face Portrait Photo URL',
    cardLicenseNumLabel: 'Card License Number (Số Thẻ)',
    issuingAuthorityLabel: 'Issuing Authority',
    cardExpiryDateLabel: 'Card Expiry Date',
    tourGuideCardUrlLabel: 'Upload Tourist Guide Card Photo URL',
    continueToStep2: 'Continue to Step 2: Face Photo',
    continueToStep3: 'Continue to Step 3: Guide Card',
    continueToStep4: 'Continue to Step 4: Policy Agreement',
    reviewAndSubmit: 'Review & Submit',
    submitToAdmin: 'Submit KYC to Admin Back-Office',
    back: 'Back',
    agreedToTermsLabel: 'I hereby declare that all uploaded identity documents (CCCD, Face, Tour Guide Card) are genuine, and I agree to the platform Terms, Safety Policy & Ethics Code.',

    // General App
    aiTourPlanner: 'AI Tour Planner',
    instantGuideGrab: 'Grab Instant Guide',
    landmarkDiscovery: 'Landmarks',
    browseTours: 'Browse Tours',
    travelerRequests: 'Traveler Requests',
    reviewsAndRatings: 'Reviews & Ratings',

    // Traveler Portal Keys
    travelerHubBadge: 'Traveler Experience Hub',
    travelerHeroTitle: 'Hire Licensed Tourist Guides & Negotiate Rates',
    travelerHeroSub: 'Post your custom trip request or select verified tourist guides. Negotiate prices directly before booking.',
    postRequestBtn: 'Post Travel Request Now',
    myRequestsTab: 'My Requests & Bids',
    searchGuidesTab: 'Search Tourist Guides',
    confirmedBookingsTab: 'Confirmed Bookings',
    myActiveBookings: 'My Active Tour Bookings',
    guideLabel: 'Guide',
    totalLabel: 'Total',
    safetyPinLabel: 'Safety PIN',
    assignedGuideLabel: 'Assigned Guide',
    pickupLabel: 'Pickup',

    // Published Requests & Bids
    publishedRequestsBadge: 'My Published Tour Requests',
    openPostsTitle: 'Your Open Posts & Bids Received',
    openPostsSub: 'Tourist guides view your request and submit price quotes.',
    createPostBtn: 'Create Travel Request Post',
    noPostsYet: 'No tour requests posted yet',
    postFirstBtn: 'Post First Request',
    bidsReceived: 'Guide Bids Received',
    incomingBidsTitle: 'Incoming Guide Price Bids & Negotiations',
    incomingBidsSub: 'Review prices offered by tourist guides, negotiate counter-offers, or accept to finalize booking.',
    noBidsYet: 'No price bids or negotiations currently.',
    guideOfferedPrice: 'Guide Offered Price',
    acceptOffer: 'Accept',
    counterOffer: 'Counter Offer',
    proposeCounterPrice: 'Propose Counter Price',
    sendCounterOffer: 'Send Counter Offer',
    confirmedBookingsTitle: 'My Confirmed Tour Bookings',
    confirmedBookingsSub: 'Active tour bookings with assigned guide and safety verification PIN.',
    noBookingsYet: 'No active bookings yet',

    // Guide Directory & Negotiate
    guidesDirectoryTitle: 'Verified Tourist Guides Directory',
    guidesDirectorySub: 'Select a verified local tourist guide and negotiate tour prices directly.',
    showVerifiedOnly: 'Show Verified License Only 📜',
    standardRate: 'Standard Rate',
    negotiatePriceBtn: 'Negotiate Price',
    negotiateModalTitle: 'Negotiate Direct Offer with Guide',
    proposedPriceLabel: 'Your Proposed Price ($ USD)',
    offerMessageLabel: 'Offer Message to Guide',
    sendOfferBtn: 'Send Offer to Guide',
    reviewsLabel: 'reviews',
    noGuidesFound: 'No guides found matching criteria',

    // Create Request Modal
    customPostBadge: 'Traveler Custom Post',
    postRequestModalTitle: 'Post Travel Request & Hire Guide',
    postRequestModalSub: 'Describe your trip needs. Verified tourist guides will bid and negotiate price directly with you.',
    tripTitleLabel: 'Trip Request Title',
    tripTitlePlaceholder: 'e.g. Seeking English guide for 1-day Cu Chi Tunnels & food tour',
    cityLabel: 'City',
    dateTimeLabel: 'Preferred Date / Time',
    durationLabel: 'Duration (Hrs)',
    groupSizeLabel: 'Group Size',
    maxBudgetLabel: 'Max Budget ($)',
    tripDetailsLabel: 'Trip Details & Requirements',
    tripDetailsPlaceholder: 'Specify what places you want to visit, transport mode preference (scooter, car, walking), food preferences...',
    preferredLanguagesLabel: 'Preferred Languages',
    publishRequestBtn: 'Publish Travel Request',
    publishingBtn: 'Posting Request...',
  },
  vi: {
    // Header & Navigation
    home: 'Trang Chủ',
    destination: 'Điểm Đến',
    traveler: 'Cổng Khách Du Lịch',
    touristGuide: 'Cổng Hướng Dẫn Viên',
    admin: 'Quản Trị Hệ Thống',
    signIn: 'Đăng Nhập / Đăng Ký',
    signOut: 'Đăng Xuất',
    googleVerified: 'Đã Xác Thực Google',
    welcomeVisitor: 'Khách Tham Quan',

    // Homepage
    heroBadge: 'NỀN TẢNG HƯỚNG DẪN VIÊN BẢO ĐẢM • THẺ CHÍNH THỨC CỤC DU LỊCH',
    heroTitle: 'Khám Phá Trải Nghiệm Bản Địa Cùng Hướng Dẫn Viên Đã Xác Minh',
    heroSubtitle: 'Tour Guide Hub kết nối du khách với đội ngũ hướng dẫn viên du lịch có thẻ hành nghề, hỗ trợ đặt tour, thương lượng giá và gọi HDV tức thời.',
    exploreGuidesBtn: 'Khám Phá Hướng Dẫn Viên',
    becomeGuideBtn: 'Đăng Ký Làm Hướng Dẫn Viên',
    adminAccessBtn: 'Cổng Quản Trị Hệ Thống',
    statsVerifiedGuides: 'HDV Đã Xác Minh',
    statsCitiesCovered: 'Thành Phố Du Lịch',
    statsLicenseMatch: 'Đối Soát Thẻ Quốc Gia',
    statsInstantBooking: 'Gọi HDV Tức Thời',

    // Ecosystem Cards
    ecosystemTitle: 'Hệ Sinh Thái 3 Vai Trò Toàn Diện Cho Du Lịch',
    ecosystemSubtitle: 'Xây dựng cho sự tương tác liền mạch giữa Khách du lịch, Hướng dẫn viên và Quản trị viên đối soát.',
    travelerFeatureTitle: 'Cho Khách Du Lịch',
    travelerFeatureDesc: 'Tìm kiếm HDV theo thành phố và ngôn ngữ, đăng bài yêu cầu lịch trình riêng và trực tiếp thương lượng giá.',
    guideFeatureTitle: 'Cho Hướng Dẫn Viên',
    guideFeatureDesc: 'Hoàn thành quy trình KYC 5 bước, đăng tour cá nhân, chào giá cho các bài đăng của du khách và tăng thu nhập.',
    adminFeatureTitle: 'Cho Quản Trị Viên',
    adminFeatureDesc: 'Tra cứu trực tiếp mã thẻ trên Cổng thông tin của Bộ Văn hóa, Thể thao và Du lịch (huongdanvien.vn) trước khi duyệt.',

    // Verification Highlight
    govVerificationTitle: '100% Hướng Dẫn Viên Đã Cấp Thẻ Thật',
    govVerificationDesc: 'Tất cả HDV trên nền tảng phải qua quy trình kiểm tra 5 bước nghiêm ngặt, đối soát số thẻ với cơ sở dữ liệu quốc gia.',
    checkPortalBtn: 'Tìm Hiểu Quy Trình Tra Cứu huongdanvien.vn',

    // Sample Guides Preview
    featuredGuidesTitle: 'Hướng Dẫn Viên Nổi Bật Tại Các Thành Phố',
    featuredGuidesSubtitle: 'Gặp gỡ các chuyên gia bản địa hàng đầu sẵn sàng dẫn bạn khám phá các điểm đến độc đáo.',
    hourlyRate: 'Giá Theo Giờ',
    viewGuideProfile: 'Xem Hồ Sơ & Đặt HDV',

    // CTA
    ctaTitle: 'Sẵn Sàng Trải Nghiệm Du Lịch Bản Địa Đích Thực?',
    ctaSubtitle: 'Đăng nhập để tạo yêu cầu chuyến đi riêng hoặc đăng ký trở thành Hướng dẫn viên ngay hôm nay.',
    getStartedTraveler: 'Bắt Đầu Làm Du Khách',
    getStartedGuide: 'Đăng Ký Làm HDV Bản Địa',

    // Auth Modal
    authTitleLogin: 'Đăng Nhập Tài Khoản',
    authTitleRegister: 'Tạo Tài Khoản Mới',
    googleLoginComingSoon: 'Đăng nhập bằng Google',
    googleComingSoonBadge: 'SẮP RA MẮT',
    googleLoginNotice: 'Tính năng đăng nhập Google đang được phát triển và sẽ sớm ra mắt. Vui lòng đăng nhập hoặc đăng ký bằng Email và Mật khẩu bên dưới.',
    emailAddress: 'Địa chỉ Email',
    password: 'Mật khẩu',
    fullName: 'Họ và tên',
    selectRole: 'Chọn Vai Trò',
    loginBtn: 'Đăng Nhập',
    signupBtn: 'Đăng Ký & Đăng Nhập',
    noAccountYet: 'Chưa có tài khoản?',
    alreadyHaveAccount: 'Đã có tài khoản?',
    quickDemoLogin: 'Tài Khoản Dùng Thử Nhanh (1 Click)',
    backendVerifiedLogin: 'Xác Thực Tài Khoản',
    tokenPayloadValidated: 'Quản lý phiên đăng nhập bảo mật qua máy chủ',
    googleAccounts: 'Tài Khoản Google',
    newGoogleLogin: 'Đăng Nhập Google Mới',
    selectGoogleAccount: 'Chọn Tài Khoản Google Đã Xác Thực',
    googleEmailAddress: 'Địa Chỉ Email Google',
    googleProfileName: 'Họ Và Tên Profile',
    targetAccountRole: 'Vai Trò Tài Khoản',
    verifyGoogleToken: 'Xác Thực ID Token Google Với Backend',
    contactingBackend: 'Đang kết nối tới máy chủ...',
    backendTokenActive: '🔒 Xác Thực Mật Khẩu & Phiên Đang Bật',

    // Roles
    roleTravelerDesc: 'Khách Du Lịch (Thuê HDV & Đặt Tour)',
    roleGuideDesc: 'Hướng Dẫn Viên Du Lịch (Cấp Thẻ & Dẫn Tour)',
    roleAdminDesc: 'Quản Trị Hệ Thống (Duyệt KYC & Thẻ HDV)',

    // Traveler Card Bullet points
    travelerFeaturePoint1: 'Lọc theo thành phố điểm đến & ngôn ngữ giao tiếp',
    travelerFeaturePoint2: 'Đăng yêu cầu tour riêng & giới hạn ngân sách',
    travelerFeaturePoint3: 'Thương lượng giá trực tiếp với các báo giá của HDV',

    // Guide Card Bullet points
    guideFeaturePoint1: 'Tải lên CCCD, ảnh chân dung & thẻ HDV',
    guideFeaturePoint2: 'Tạo tour cá nhân hoặc chào giá bài đăng du khách',
    guideFeaturePoint3: 'Quản lý trạng thái trực tuyến đón khách tức thời kiểu Grab',

    // Admin Card Bullet points
    adminFeaturePoint1: 'Liên kết trực tiếp cổng thông tin quốc gia huongdanvien.vn',
    adminFeaturePoint2: 'Đối soát CCCD, Ảnh chân dung & Hạn thẻ',
    adminFeaturePoint3: 'Phê duyệt hoặc gửi hướng dẫn bổ sung cho HDV',

    // National Database Integration section
    natDbIntegrationBadge: 'Tích Hợp Cơ Sở Dữ Liệu Du Lịch Quốc Gia',
    cardNumVerifyTitle: 'Xác Minh Số Thẻ Hướng Dẫn Viên',
    cardNumVerifyDesc: 'Mã số thẻ được sao chép trực tiếp và tra cứu trên dữ liệu của Bộ tại huongdanvien.vn.',
    fraudPrevTitle: 'Phòng Chống Gian Lận 3 Chứng Từ',
    fraudPrevDesc: 'Đối soát đồng thời CCCD, ảnh chân dung thực tế và thẻ HDV du lịch.',

    // Live Portal Demo Window
    lookupPortalTitle: 'huongdanvien.vn • Cổng Tra Cứu',
    liveVerifiedBadge: 'XÁC MINH TRỰC TUYẾN',
    guideNameLabel: 'Họ và tên HDV:',
    licenseNumberLabel: 'Số thẻ HDV:',
    issuingAuthorityPortalLabel: 'Nơi cấp thẻ:',
    issuingAuthHCMC: 'Sở Du Lịch TP. Hồ Chí Minh',
    nationalStatusLabel: 'Trạng thái thẻ:',
    activeLicenseBadge: 'THẺ ĐANG HOẠT ĐỘNG',

    // Admin & KYC Guide
    officialGovPortalGuide: 'Hướng Dẫn Tra Cứu Thẻ HDV Trên Cổng Thông Tin Chính Thức',
    vnatGuideLookup: 'Tra Cứu Hướng Dẫn Viên - Cục Du Lịch Quốc Gia Việt Nam (VNAT)',
    vnatGuideLookupDesc: 'Trước khi phê duyệt thẻ Hướng Dẫn Viên, Quản trị viên cần tra cứu mã số thẻ trên Cổng thông tin của Bộ Văn hóa, Thể thao và Du lịch.',
    step1CopyCardNum: '1. Sao chép Số Thẻ HDV',
    step1CopyCardNumDesc: 'Nhấn "Sao chép Số Thẻ" tại danh sách hồ sơ bên dưới.',
    step2OpenPortal: '2. Mở Cổng Thông Tin',
    step2OpenPortalDesc: 'Mở trang huongdanvien.vn và dán số thẻ vào ô tìm kiếm.',
    step3VerifyDecision: '3. Đối Soát & Phê Duyệt',
    step3VerifyDecisionDesc: 'Kiểm tra thông tin CCCD, Ảnh chân chân dung và Ngày hết hạn thẻ trùng khớp trước khi duyệt.',
    openPortalBtn: 'Mở Trang huongdanvien.vn',
    pendingApproval: 'Đang Chờ Duyệt',
    guideInfo: 'Thông Tin HDV',
    licenseCardDetails: 'Chi Tiết Thẻ HDV',
    verificationArtifacts: '3 Chứng Từ Xác Minh',
    submittedDate: 'Ngày Gửi',
    statusLabel: 'Trạng Thái',
    adminActions: 'Thao Tác Admin',
    viewArtifacts: 'Xem CCCD + Mặt + Thẻ',
    approve: 'Phê Duyệt',
    decline: 'Từ Chối',
    declineGuideKYC: 'Từ Chối Hồ Sơ KYC Hướng Dẫn Viên',
    primaryDeclineReason: 'Lý Do Từ Chối Chính',
    declineInstructionsLabel: 'Hướng Dẫn Cho Hướng Dẫn Viên (Cách Khắc Phục)',
    confirmDecline: 'Xác Nhận Từ Chối',
    cancel: 'Hủy Bỏ',

    // KYC 5-Step Pipeline Modal
    kycPipelineTitle: 'Quy Trình 5 Bước Xác Minh Thẻ Hướng Dẫn Viên Du Lịch',
    licenseAndIdentityHeader: 'Xác Minh Danh Tính & Thẻ Hành Nghề',
    licenseAndIdentityDesc: 'Hoàn thành các bước bắt buộc để được Quản Trị Viên đối soát dữ liệu trên cổng du lịch quốc gia (huongdanvien.vn).',
    step1Cccd: '1. CCCD',
    step2Face: '2. Ảnh Mặt',
    step3GuideCard: '3. Thẻ HDV',
    step4Terms: '4. Điều Khoản',
    step5Submit: '5. Nộp Hồ Sơ',
    cccdNumberLabel: 'Số CCCD / Hộ Chiếu',
    cccdFrontUrlLabel: '1. URL Ảnh Mặt Trước CCCD',
    cccdBackUrlLabel: '2. URL Ảnh Mặt Sau CCCD',
    facePhotoUrlLabel: 'URL Ảnh Chân Dung Mặt',
    cardLicenseNumLabel: 'Số Thẻ Hướng Dẫn Viên Du Lịch',
    issuingAuthorityLabel: 'Cơ Quan Cấp Thẻ',
    cardExpiryDateLabel: 'Ngày Hết Hạn Thẻ',
    tourGuideCardUrlLabel: 'URL Ảnh Thẻ Hướng Dẫn Viên Du Lịch',
    continueToStep2: 'Tiếp Tục Bước 2: Chụp Ảnh Mặt',
    continueToStep3: 'Tiếp Tục Bước 3: Thẻ Hướng Dẫn Viên',
    continueToStep4: 'Tiếp Tục Bước 4: Đồng Ý Điều Khoản',
    reviewAndSubmit: 'Kiểm Tra & Nộp Hồ Sơ',
    submitToAdmin: 'Nộp Hồ Sơ KYC Cho Admin',
    back: 'Quay Lại',
    agreedToTermsLabel: 'Tôi cam đoan mọi giấy tờ (CCCD, Ảnh chân dung, Thẻ HDV) là chính chủ và đồng ý với Quy chế, Điều khoản an toàn du lịch của nền tảng.',

    // General App
    aiTourPlanner: 'Lập Kế Hoạch Tour AI',
    instantGuideGrab: 'Gọi HDV Tức Thời',
    landmarkDiscovery: 'Địa Danh Du Lịch',
    browseTours: 'Danh Sách Tour',
    travelerRequests: 'Yêu Cầu Khách Hàng',
    reviewsAndRatings: 'Đánh Giá & Nhận Xét',

    // Traveler Portal Keys
    travelerHubBadge: 'Trung Tâm Khách Du Lịch',
    travelerHeroTitle: 'Thuê Hướng Dẫn Viên Có Thẻ & Thương Lượng Giá',
    travelerHeroSub: 'Đăng yêu cầu chuyến đi riêng hoặc chọn hướng dẫn viên đã xác minh. Thương lượng giá trực tiếp trước khi đặt tour.',
    postRequestBtn: 'Đăng Yêu Cầu Chuyến Đi Ngay',
    myRequestsTab: 'Yêu Cầu & Báo Giá Của Tôi',
    searchGuidesTab: 'Tìm Hướng Dẫn Viên',
    confirmedBookingsTab: 'Đơn Tour Đã Xác Nhận',
    myActiveBookings: 'Các Tour Đang Hoạt Động Của Tôi',
    guideLabel: 'Hướng Dẫn Viên',
    totalLabel: 'Tổng Tiền',
    safetyPinLabel: 'Mã PIN An Toàn',
    assignedGuideLabel: 'HDV Phụ Trách',
    pickupLabel: 'Điểm Đón',

    // Published Requests & Bids
    publishedRequestsBadge: 'Yêu Cầu Tour Đã Đăng Của Tôi',
    openPostsTitle: 'Bài Đăng Đang Mở & Báo Giá Nhận Được',
    openPostsSub: 'Hướng dẫn viên sẽ xem yêu cầu của bạn và gửi báo giá thương lượng.',
    createPostBtn: 'Tạo Bài Đăng Yêu Cầu Tour',
    noPostsYet: 'Chưa có yêu cầu tour nào được đăng',
    postFirstBtn: 'Đăng Yêu Cầu Đầu Tiên',
    bidsReceived: 'Báo Giá Nhận Được Từ HDV',
    incomingBidsTitle: 'Thương Lượng & Báo Giá Từ Hướng Dẫn Viên',
    incomingBidsSub: 'Xem xét báo giá từ các HDV, thương lượng giá phản hồi hoặc chấp nhận để hoàn tất đặt tour.',
    noBidsYet: 'Hiện chưa có báo giá hay thương lượng nào.',
    guideOfferedPrice: 'Giá HDV Đề Xuất',
    acceptOffer: 'Chấp Nhận',
    counterOffer: 'Thương Lượng Lại',
    proposeCounterPrice: 'Đề Xuất Mức Giá Phản Hồi',
    sendCounterOffer: 'Gửi Báo Giá Phản Hồi',
    confirmedBookingsTitle: 'Các Tour Đặt Thành Công Của Tôi',
    confirmedBookingsSub: 'Danh sách tour đã xác nhận kèm HDV phụ trách và mã PIN an toàn.',
    noBookingsYet: 'Chưa có đơn đặt tour nào',

    // Guide Directory & Negotiate
    guidesDirectoryTitle: 'Danh Sách Hướng Dẫn Viên Đã Xác Minh',
    guidesDirectorySub: 'Lựa chọn hướng dẫn viên địa phương có thẻ hành nghề và thương lượng giá trực tiếp.',
    showVerifiedOnly: 'Chỉ Hiện HDV Đã Có Thẻ 📜',
    standardRate: 'Giá Tiêu Chuẩn',
    negotiatePriceBtn: 'Thương Lượng Giá',
    negotiateModalTitle: 'Thương Lượng Giá Trực Tiếp Với HDV',
    proposedPriceLabel: 'Mức Giá Bạn Đề Xuất ($ USD)',
    offerMessageLabel: 'Lời Nhắn Gửi Đến Hướng Dẫn Viên',
    sendOfferBtn: 'Gửi Báo Giá Cho HDV',
    reviewsLabel: 'đánh giá',
    noGuidesFound: 'Không tìm thấy hướng dẫn viên phù hợp',

    // Create Request Modal
    customPostBadge: 'Yêu Cầu Tùy Chỉnh Của Du Khách',
    postRequestModalTitle: 'Đăng Yêu Cầu Chuyến Đi & Thuê HDV',
    postRequestModalSub: 'Mô tả nhu cầu chuyến đi. Các hướng dẫn viên đã xác minh sẽ báo giá và thương lượng trực tiếp.',
    tripTitleLabel: 'Tiêu Đề Yêu Cầu Chuyến Đi',
    tripTitlePlaceholder: 'VD: Tìm HDV tiếng Anh đi Địa đạo Củ Chi & tour ẩm thực 1 ngày',
    cityLabel: 'Thành Phố',
    dateTimeLabel: 'Thời Gian / Ngày Mong Muốn',
    durationLabel: 'Thời Lượng (Giờ)',
    groupSizeLabel: 'Số Lượng Khách',
    maxBudgetLabel: 'Ngân Sách Tối Đa ($)',
    tripDetailsLabel: 'Chi Tiết & Yêu Cầu Chuyến Đi',
    tripDetailsPlaceholder: 'Nêu rõ các điểm muốn tham quan, phương tiện ưu tiên (xe máy, ô tô, đi bộ), khẩu vị ăn uống...',
    preferredLanguagesLabel: 'Ngôn Ngữ Ưu Tiên',
    publishRequestBtn: 'Đăng Yêu Cầu Chuyến Đi',
    publishingBtn: 'Đang Đăng...',
  }
};

export function getDefaultLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'en' || saved === 'vi') {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    if (window.navigator) {
      const lang = window.navigator.language || '';
      if (lang.toLowerCase().startsWith('vi')) {
        return 'vi';
      }
    }
  }
  return 'en';
}
