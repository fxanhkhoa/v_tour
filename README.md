# Tour Guide Hub — Real-Time Local Tour Guide Booking Platform

Tour Guide Hub connects international travelers directly with verified local tour guides across Southeast Asia.

---

## 🔑 Test Accounts & Demo Credentials

You can test all roles (Traveler, Verified Guide, Under Review Guide, Admin) using the credentials below or via the **Quick Demo Login** buttons inside the Sign In modal.

| Role | Account Name | Email / Username | Default Password | Verification Status | Key Features to Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🧑‍🦱 **Traveler** | Sarah Jenkins | `sarah@example.com` | `password123` | N/A | Post travel requests, filter guides, negotiate prices, book tours, live chat |
| 📜 **Verified Guide** | Nguyen Van Minh | `minh.tourguide@gmail.com` | `password123` | **Verified 📜** (License `VN-TG-889012`) | Submit bids on traveler posts, manage tour packages, accept negotiations, view schedule |
| ⏳ **Under Review Guide** | Somchai Prasert | `somchai@example.com` | `password123` | **Under Review ⏳** (License `TH-TG-442109`) | Test "Under Review" banners, view pending KYC application modal, update document info |
| 🛡️ **Platform Admin** | Alexander Wright | `admin@tourguidehub.com` | `password123` | **Operations Lead** | KYC verification queue, approve/reject guide license cards, system stats & metrics |

---

## 📋 Additional Demo Guide Accounts

| Guide Name | Email | City | Status | License Card # |
| :--- | :--- | :--- | :--- | :--- |
| **Le Thi Mai Chi** | `maichi.hanoi@gmail.com` | Hanoi | Verified 📜 | `VN-TG-991204` |
| **Tran Duc Hoang** | `hoang.danang@gmail.com` | Da Nang | Verified 📜 | `VN-TG-773412` |
| **Vo Thi Kim Anh** | `kimanh.hoian@gmail.com` | Hoi An | Verified 📜 | `VN-TG-664109` |
| **Pham Quoc Bao** | `baopham.hue@gmail.com` | Hue | Verified 📜 | `VN-TG-552190` |
| **Nguyen Linh Chi** | `linhchi.phuquoc@gmail.com` | Phu Quoc | Verified 📜 | `VN-TG-443210` |
| **Hoang Van Nam** | `namhoang.halong@gmail.com` | Ha Long Bay | Verified 📜 | `VN-TG-331002` |
| **Bui Van Tam** | `tam.nhatrang@gmail.com` | Nha Trang | Verified 📜 | `VN-TG-221089` |
| **Giang A Lu** | `alu.sapa@gmail.com` | Sapa | Verified 📜 | `VN-TG-110923` |
| **Nguyen Thi Hong** | `hong.cantho@gmail.com` | Can Tho | Verified 📜 | `VN-TG-990812` |
| **Kanyanat "Nok" Suwan** | `nok.chiangmai@gmail.com` | Chiang Mai | Verified 📜 | `TH-TG-778899` |
| **Anan Chatchai** | `anan.phuket@gmail.com` | Phuket | Verified 📜 | `TH-TG-554433` |
| **Kenji Sato** | `kenji.tokyo@gmail.com` | Tokyo | Verified 📜 | `JP-TG-901234` |
| **Yuki Tanaka** | `yuki.kyoto@gmail.com` | Kyoto | Verified 📜 | `JP-TG-890123` |

---

## 🚀 How to Test Verification & Bidding Flow

1. **Sign in as `Somchai Prasert` (`somchai@example.com`)**:
   - Open the **Tour Guide Dashboard**.
   - Observe the **Under Review ⏳** header badge and pending banner.
   - Click **View Application ⏳** to see the detailed KYC review modal displaying submitted card numbers, authority details, and document photos.

2. **Sign in as `Alexander Wright` (`admin@tourguidehub.com`)**:
   - Go to the **Admin Dashboard** -> **KYC License Queue**.
   - Review pending submissions and click **Approve License** or **Reject**.

3. **Sign in as `Nguyen Van Minh` (`minh.tourguide@gmail.com`)**:
   - Go to **Traveler Requests & Negotiations**.
   - Submit bids or accept counter-offers freely with active verified status.

4. **Sign in as `Sarah Jenkins` (`sarah@example.com`)**:
   - Post a new tour request in Saigon or Hanoi, receive guide bids, and start price negotiations.
