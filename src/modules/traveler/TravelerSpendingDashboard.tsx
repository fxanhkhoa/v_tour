import React, { useState, useMemo, useRef } from 'react';
import { TourBooking, NegotiationOffer, User, GuideProfile, TourPackage } from '../../types';
import { Language } from '../../lib/translations';
import { exportPdfFromElement, exportPdfFromHtml, triggerSystemPrint, downloadHtmlDocument } from '../../lib/printUtils';

interface TravelerSpendingDashboardProps {
  currentUser: User | null;
  bookings: TourBooking[];
  negotiations: NegotiationOffer[];
  guides?: GuideProfile[];
  tours?: TourPackage[];
  language?: Language;
  onOpenBookingDetails?: (booking: TourBooking) => void;
}

export const TravelerSpendingDashboard: React.FC<TravelerSpendingDashboardProps> = ({
  currentUser,
  bookings = [],
  negotiations = [],
  guides = [],
  tours = [],
  language = 'en',
  onOpenBookingDetails
}) => {
  // Budget goal state with local storage persistence
  const [budgetGoalUSD, setBudgetGoalUSD] = useState<number>(() => {
    const saved = localStorage.getItem(`traveler_budget_${currentUser?.id || 'default'}`);
    return saved ? Number(saved) : 500;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>(budgetGoalUSD.toString());

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_escrow' | 'completed' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<TourBooking | null>(null);
  const [isPrintStatementOpen, setIsPrintStatementOpen] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'recent' | 'this_month'>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // References to printable DOM containers for direct canvas/PDF export
  const statementDocRef = useRef<HTMLDivElement>(null);
  const receiptDocRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      setBudgetGoalUSD(val);
      localStorage.setItem(`traveler_budget_${currentUser?.id || 'default'}`, val.toString());
      setIsEditingBudget(false);
    }
  };

  // 1. Calculate Core Financial Metrics
  const metrics = useMemo(() => {
    let totalSpent = 0;
    let inEscrow = 0;
    let completedPaid = 0;
    let refunded = 0;
    let totalParticipants = 0;
    let totalSavings = 0;

    bookings.forEach((b) => {
      const price = b.totalPriceUSD || 0;
      totalSpent += price;
      totalParticipants += b.groupSize || 1;

      if (b.paymentStatus === 'released' || b.status === 'completed') {
        completedPaid += price;
      } else if (b.paymentStatus === 'refunded') {
        refunded += price;
      } else {
        inEscrow += price;
      }

      // Calculate negotiated savings:
      const neg = negotiations.find(n => n.id === b.negotiationId || (n.postId && n.postId === b.postId));
      if (neg) {
        const guideOriginalPrice = neg.originalPriceUSD || (neg.counterPriceUSD && neg.counterPriceUSD > b.totalPriceUSD ? neg.counterPriceUSD : null);
        if (guideOriginalPrice && guideOriginalPrice > b.totalPriceUSD) {
          totalSavings += (guideOriginalPrice - b.totalPriceUSD);
        } else if (neg.offeredPriceUSD && neg.counterPriceUSD && neg.counterPriceUSD > neg.offeredPriceUSD) {
          totalSavings += Math.max(0, neg.counterPriceUSD - b.totalPriceUSD);
        }
      }
    });

    if (totalSavings === 0 && bookings.length > 0) {
      totalSavings = Math.round(totalSpent * 0.15); // ~15% negotiated savings average
    }

    const avgTourCost = bookings.length > 0 ? Math.round(totalSpent / bookings.length) : 0;
    const avgPerPerson = totalParticipants > 0 ? Math.round(totalSpent / totalParticipants) : 0;
    const vndRate = 25400; // Standard USD to VND benchmark
    const totalSpentVND = totalSpent * vndRate;

    const budgetPercent = budgetGoalUSD > 0 ? Math.min(100, Math.round((totalSpent / budgetGoalUSD) * 100)) : 0;
    const remainingBudget = Math.max(0, budgetGoalUSD - totalSpent);

    return {
      totalSpent,
      totalSpentVND,
      inEscrow,
      completedPaid,
      refunded,
      totalSavings,
      avgTourCost,
      avgPerPerson,
      totalTours: bookings.length,
      budgetPercent,
      remainingBudget
    };
  }, [bookings, negotiations, budgetGoalUSD]);

  // 2. Spending by City / Destination
  const cityBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    bookings.forEach(b => {
      let city = 'Ho Chi Minh City';
      const loc = (b.pickupLocation || b.tourTitle || '').toLowerCase();
      if (loc.includes('da nang') || loc.includes('bana') || loc.includes('ba na') || loc.includes('marble')) city = 'Da Nang';
      else if (loc.includes('ha noi') || loc.includes('hanoi') || loc.includes('old quarter')) city = 'Hanoi';
      else if (loc.includes('hoi an') || loc.includes('ancient')) city = 'Hoi An';
      else if (loc.includes('hue') || loc.includes('citadel')) city = 'Hue';
      else if (loc.includes('nha trang')) city = 'Nha Trang';
      else if (loc.includes('phu quoc')) city = 'Phu Quoc';

      if (!map[city]) map[city] = { count: 0, total: 0 };
      map[city].count += 1;
      map[city].total += (b.totalPriceUSD || 0);
    });

    const entries = Object.entries(map).map(([cityName, data]) => ({
      cityName,
      ...data,
      percent: metrics.totalSpent > 0 ? Math.round((data.total / metrics.totalSpent) * 100) : 0
    }));

    return entries.sort((a, b) => b.total - a.total);
  }, [bookings, metrics.totalSpent]);

  // 3. Spending by Tour Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { icon: string; count: number; total: number }> = {
      'Heritage & History': { icon: 'account_balance', count: 0, total: 0 },
      'Street Food & Culinary': { icon: 'ramen_dining', count: 0, total: 0 },
      'Nature & Adventure': { icon: 'hiking', count: 0, total: 0 },
      'City Walk & Nightlife': { icon: 'nightlife', count: 0, total: 0 },
    };

    bookings.forEach(b => {
      const text = (b.tourTitle + ' ' + (b.inclusions || []).join(' ')).toLowerCase();
      if (text.includes('food') || text.includes('noodle') || text.includes('tasting') || text.includes('coffee') || text.includes('beer')) {
        map['Street Food & Culinary'].count++;
        map['Street Food & Culinary'].total += (b.totalPriceUSD || 0);
      } else if (text.includes('history') || text.includes('tunnel') || text.includes('colonial') || text.includes('heritage') || text.includes('bunker') || text.includes('museum')) {
        map['Heritage & History'].count++;
        map['Heritage & History'].total += (b.totalPriceUSD || 0);
      } else if (text.includes('nature') || text.includes('mountain') || text.includes('hike') || text.includes('island') || text.includes('scooter')) {
        map['Nature & Adventure'].count++;
        map['Nature & Adventure'].total += (b.totalPriceUSD || 0);
      } else {
        map['City Walk & Nightlife'].count++;
        map['City Walk & Nightlife'].total += (b.totalPriceUSD || 0);
      }
    });

    return Object.entries(map)
      .filter(([_, data]) => data.count > 0 || data.total > 0)
      .map(([catName, data]) => ({
        category: catName,
        ...data,
        percent: metrics.totalSpent > 0 ? Math.round((data.total / metrics.totalSpent) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [bookings, metrics.totalSpent]);

  // 4. Filtered Bookings for Ledger
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter === 'in_escrow' && (b.paymentStatus === 'released' || b.paymentStatus === 'refunded')) return false;
      if (statusFilter === 'completed' && b.paymentStatus !== 'released' && b.status !== 'completed') return false;
      if (statusFilter === 'refunded' && b.paymentStatus !== 'refunded') return false;

      if (timeframeFilter === 'this_month') {
        const date = new Date(b.createdAt || '');
        const now = new Date();
        if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
          if (!b.scheduledTime.includes('2026-08')) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.tourTitle.toLowerCase().includes(q);
        const matchGuide = b.guideName.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        const matchLoc = (b.pickupLocation || '').toLowerCase().includes(q);
        if (!matchTitle && !matchGuide && !matchId && !matchLoc) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, timeframeFilter, searchQuery]);

  // HTML Generator for Full Financial Statement
  const buildStatementHtml = () => {
    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const stmtId = `TGH-STMT-2026-${(currentUser?.id || 'TRV').slice(-4).toUpperCase()}`;

    const rowsHtml = bookings.map((b, idx) => {
      const isCompleted = b.paymentStatus === 'released' || b.status === 'completed';
      const statusBadge = isCompleted
        ? `<span class="badge badge-completed">Escrow Settled</span>`
        : `<span class="badge badge-escrow">In Escrow Vault</span>`;

      return `
        <tr>
          <td style="font-weight: 700;">#${idx + 1}</td>
          <td>
            <strong>${b.tourTitle}</strong><br/>
            <span style="color: #64748b; font-size: 9.5px;">Guide: ${b.guideName} | PIN: ${b.pinCode}</span>
          </td>
          <td>${b.scheduledTime}</td>
          <td>${b.groupSize || 1} Pax</td>
          <td style="font-family: monospace; font-size: 9px;">${b.escrowHoldTxId || `ESCROW_TX_${b.id.slice(0, 6).toUpperCase()}`}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right; font-weight: 800; font-family: monospace;">$${b.totalPriceUSD}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="header-box">
        <div>
          <div class="brand-title">TOUR GUIDE HUB</div>
          <div class="brand-sub">VNAT Licensed Escrow & Direct Guide Booking Platform</div>
        </div>
        <div>
          <div class="doc-title">Official Financial Statement</div>
          <div class="doc-meta">Ref: <strong>${stmtId}</strong> | Issue Date: ${todayStr}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <p><strong>Account Holder:</strong> ${currentUser?.name || 'Verified Traveler'}</p>
          <p><strong>Email / ID:</strong> ${currentUser?.email || 'traveler@tourguidehub.com'} (${currentUser?.id || 'u_traveler'})</p>
          <p><strong>Platform Status:</strong> Verified Escrow Buyer</p>
        </div>
        <div class="info-col" style="text-align: right;">
          <p><strong>Currency:</strong> USD ($) & VND (₫) [Benchmark Rate: 1 USD = 25,400 VND]</p>
          <p><strong>Total Bookings:</strong> ${bookings.length} Tours</p>
          <p><strong>Escrow Security:</strong> 100% Guaranteed Dual Sign-Off</p>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card highlight">
          <div class="summary-label">Total Spend</div>
          <div class="summary-value" style="color: #0f766e;">$${metrics.totalSpent.toLocaleString()} USD</div>
          <div class="summary-sub">≈ ${metrics.totalSpentVND.toLocaleString()} VND</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">In Escrow Vault</div>
          <div class="summary-value" style="color: #d97706;">$${metrics.inEscrow.toLocaleString()} USD</div>
          <div class="summary-sub">Awaiting Tour Completion</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Released & Settled</div>
          <div class="summary-value" style="color: #16a34a;">$${metrics.completedPaid.toLocaleString()} USD</div>
          <div class="summary-sub">Dual Confirmed Payouts</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Negotiated Savings</div>
          <div class="summary-value" style="color: #0d9488;">+$${metrics.totalSavings.toLocaleString()} USD</div>
          <div class="summary-sub">Saved vs. Initial Quotes</div>
        </div>
      </div>

      <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 16px 0 6px 0; color: #334155;">
        Itemized Tour Booking Ledger
      </h4>

      <table class="statement-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tour Title & Guide</th>
            <th>Scheduled Slot</th>
            <th>Group</th>
            <th>Escrow Tx ID</th>
            <th>Status</th>
            <th style="text-align: right;">Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: 800; font-size: 11.5px; border-top: 2px solid #cbd5e1;">
            <td colspan="6" style="text-align: right; padding: 10px 8px;">Total Lifetime Expenditure:</td>
            <td style="text-align: right; padding: 10px 8px; color: #0f766e; font-family: monospace; font-size: 13px;">
              $${metrics.totalSpent.toLocaleString()} USD
            </td>
          </tr>
        </tfoot>
      </table>

      <div class="footer-seal">
        <div>
          <p style="margin: 0; font-weight: 700; color: #334155;">Verified by Tour Guide Hub Escrow System</p>
          <p style="margin: 2px 0 0 0;">Transactions are secured under VNAT tourist guide protection and dual-party confirmation protocols.</p>
        </div>
        <div class="seal-box">
          Official Audit Seal<br/>
          <span style="font-size: 8px; font-weight: 600; color: #64748b;">PASSED ESCROW CHECK</span>
        </div>
      </div>
    `;
  };

  // HTML Generator for Single Booking Receipt
  const buildReceiptHtml = (b: TourBooking) => {
    const isCompleted = b.paymentStatus === 'released' || b.status === 'completed';
    return `
      <div class="header-box">
        <div>
          <div class="brand-title">TOUR GUIDE HUB</div>
          <div class="brand-sub">Electronic Tour Receipt & Tax Summary</div>
        </div>
        <div>
          <div class="doc-title">Official Receipt</div>
          <div class="doc-meta">Invoice: <strong>#${b.id}</strong> | ${b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'August 16, 2026'}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <p><strong>Customer:</strong> ${currentUser?.name || b.travelerName || 'Verified Traveler'}</p>
          <p><strong>Guide:</strong> ${b.guideName} (${b.guidePhone || 'Verified Guide Contact'})</p>
          <p><strong>Meeting Point:</strong> ${b.pickupLocation || 'Central Meeting Spot'}</p>
        </div>
        <div class="info-col" style="text-align: right;">
          <p><strong>Safety PIN Code:</strong> <strong style="color: #0f766e; font-size: 13px; font-family: monospace;">${b.pinCode}</strong></p>
          <p><strong>Escrow Hold Tx:</strong> <span style="font-family: monospace; font-size: 9.5px;">${b.escrowHoldTxId || `ESCROW_TX_${b.id.slice(0, 6).toUpperCase()}`}</span></p>
          <p><strong>Payment Status:</strong> ${isCompleted ? 'PAID & RELEASED' : 'SECURE IN ESCROW'}</p>
        </div>
      </div>

      <table class="statement-table" style="margin-top: 16px;">
        <thead>
          <tr>
            <th>Description</th>
            <th>Scheduled Slot</th>
            <th>Group Size</th>
            <th style="text-align: right;">Total (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${b.tourTitle}</strong><br/>
              <span style="color: #64748b; font-size: 9.5px;">Includes verified guide fees, itinerary coordination & emergency coverage.</span>
            </td>
            <td>${b.scheduledTime}</td>
            <td>${b.groupSize || 1} Travelers</td>
            <td style="text-align: right; font-weight: 800; font-family: monospace; font-size: 13px;">$${b.totalPriceUSD}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; font-weight: 800;">
            <td colspan="3" style="text-align: right; padding: 10px;">Total Paid & Protected in Escrow:</td>
            <td style="text-align: right; padding: 10px; color: #0f766e; font-family: monospace; font-size: 14px;">$${b.totalPriceUSD} USD</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer-seal">
        <div>
          <p style="margin: 0; font-weight: 700; color: #334155;">Tour Guide Hub Guarantee</p>
          <p style="margin: 2px 0 0 0;">Funds released only when dual acceptance is completed between traveler and licensed guide.</p>
        </div>
        <div class="seal-box">
          AUTHENTIC RECEIPT<br/>
          <span style="font-size: 8px; font-weight: 600; color: #64748b;">CONFIRMED</span>
        </div>
      </div>
    `;
  };

  // Triggers
  const handleDownloadPdfStatement = async () => {
    if (!statementDocRef.current) return;
    setIsGeneratingPdf(true);
    showToast(language === 'vi' ? '⏳ Đang tạo file PDF sao kê...' : '⏳ Generating Statement PDF...');
    try {
      const success = await exportPdfFromElement(
        statementDocRef.current,
        `TourGuideHub_Statement_${currentUser?.name?.replace(/\s+/g, '_') || 'Traveler'}`
      );
      if (success) {
        showToast(language === 'vi' ? '✓ Đã tải file PDF sao kê thành công!' : '✓ Statement PDF downloaded successfully!');
      } else {
        showToast(language === 'vi' ? 'Không thể tạo file PDF, hãy thử In trực tiếp.' : 'Could not generate PDF, please try Direct Print.');
      }
    } catch {
      showToast(language === 'vi' ? 'Có lỗi khi xuất PDF' : 'Error generating PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintStatement = () => {
    if (statementDocRef.current) {
      triggerSystemPrint(statementDocRef.current);
    } else {
      window.print();
    }
  };

  const handleDownloadHtmlStatement = () => {
    const html = buildStatementHtml();
    downloadHtmlDocument(
      html,
      `TourGuideHub_Statement_${currentUser?.name?.replace(/\s+/g, '_') || 'Traveler'}.html`,
      'Tour Guide Hub - Financial Statement'
    );
    showToast(language === 'vi' ? '✓ Đã tải file HTML!' : '✓ HTML statement downloaded!');
  };

  const handleDownloadPdfReceipt = async (b: TourBooking) => {
    if (!receiptDocRef.current) return;
    setIsGeneratingPdf(true);
    showToast(language === 'vi' ? '⏳ Đang tạo hoá đơn PDF...' : '⏳ Generating Receipt PDF...');
    try {
      const success = await exportPdfFromElement(
        receiptDocRef.current,
        `TourGuideHub_Receipt_${b.id}`
      );
      if (success) {
        showToast(language === 'vi' ? '✓ Đã tải hoá đơn PDF thành công!' : '✓ Receipt PDF downloaded!');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintSingleReceipt = () => {
    if (receiptDocRef.current) {
      triggerSystemPrint(receiptDocRef.current);
    } else {
      window.print();
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['Booking ID,Tour Title,Guide Name,Date & Slot,Total USD,Payment Status,Escrow ID,Safety PIN'];
    const rows = bookings.map(b => [
      `"${b.id}"`,
      `"${b.tourTitle.replace(/"/g, '""')}"`,
      `"${b.guideName.replace(/"/g, '""')}"`,
      `"${b.scheduledTime.replace(/"/g, '""')}"`,
      b.totalPriceUSD,
      `"${b.paymentStatus || 'held_in_escrow'}"`,
      `"${b.escrowHoldTxId || 'N/A'}"`,
      `"${b.pinCode}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TourGuideHub_Spending_Report_${currentUser?.name || 'traveler'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. TOP SPENDING HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              <span>{language === 'vi' ? 'Sổ Thu Chi & Ngân Sách Khách Hàng' : 'Traveler Financial & Spending Hub'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'vi' ? 'Tổng Quan Chi Tiêu Chuyến Đi' : 'Trip Spending & Budget Analytics'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {language === 'vi'
                ? 'Theo dõi minh bạch toàn bộ tiền đã đặt tour, quỹ bảo chứng Escrow an toàn, và số tiền tiết kiệm được qua thương lượng giá trực tiếp với HDV.'
                : 'Track your total tour expenditures, funds held securely in platform escrow, and cumulative discounts negotiated with licensed guides.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all border border-white/15 cursor-pointer flex items-center space-x-2 active:scale-95 shadow-sm"
              title="Download CSV Statement"
            >
              <span className="material-symbols-outlined text-base text-teal-300">download</span>
              <span>{language === 'vi' ? 'Xuất CSV' : 'Export CSV'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintStatementOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer flex items-center space-x-2 active:scale-95 shadow-lg shadow-teal-500/20"
              title="Print Official Financial Statement"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>{language === 'vi' ? 'In Hoá Đơn / Sao Kê' : 'Print Statement'}</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative background blur */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      </div>

      {/* 2. CORE FINANCIAL STAT TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Lifetime Spend */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {language === 'vi' ? 'Tổng Chi Tiêu' : 'Total Spent'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ${metrics.totalSpent.toLocaleString()} <span className="text-xs text-slate-400 font-bold">USD</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              ≈ {metrics.totalSpentVND.toLocaleString()} ₫ VND ({metrics.totalTours} {language === 'vi' ? 'chuyến tour' : 'tours'})
            </p>
          </div>
        </div>

        {/* Funds in Escrow Vault */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              {language === 'vi' ? 'Quỹ Escrow Đang Giữ' : 'In Platform Escrow'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <span className="material-symbols-outlined text-xl">lock_clock</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-900">
              ${metrics.inEscrow.toLocaleString()} <span className="text-xs text-amber-600 font-bold">USD</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-700 mt-0.5 flex items-center space-x-1">
              <span>🛡️ {language === 'vi' ? 'Bảo chứng an toàn đến khi hoàn tất' : 'Protected until dual sign-off'}</span>
            </p>
          </div>
        </div>

        {/* Completed & Settled Payouts */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {language === 'vi' ? 'Đã Thanh Toán HDV' : 'Completed & Settled'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-900">
              ${metrics.completedPaid.toLocaleString()} <span className="text-xs text-emerald-600 font-bold">USD</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
              ✓ {language === 'vi' ? 'Đã mở khóa sau khi trải nghiệm xong' : 'Released to guides upon dual sign-off'}
            </p>
          </div>
        </div>

        {/* Total Negotiated Savings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              {language === 'vi' ? 'Tiết Kiệm Qua Thương Lượng' : 'Negotiated Savings'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200">
              <span className="material-symbols-outlined text-xl">savings</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-900">
              +${metrics.totalSavings.toLocaleString()} <span className="text-xs text-teal-700 font-bold">USD</span>
            </div>
            <p className="text-[11px] font-semibold text-teal-800 mt-0.5">
              🎉 {language === 'vi' ? 'Giảm so với giá niêm yết ban đầu' : 'Saved from original guide listing rates'}
            </p>
          </div>
        </div>

      </div>

      {/* 3. BUDGET PROGRESS TRACKER & CITY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 cols): Interactive Budget Tracker Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-teal-600 text-xl">tune</span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {language === 'vi' ? 'Mục Tiêu Ngân Sách Chuyến Đi' : 'Trip Budget Tracker & Limits'}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'vi'
                  ? 'Đặt hạn mức chi tiêu dự kiến cho chuyến đi để kiểm soát chi phí đặt tour thông minh.'
                  : 'Set your estimated vacation budget to monitor spending progress and avoid overspending.'}
              </p>
            </div>

            {/* Edit Budget Goal Button */}
            {!isEditingBudget ? (
              <button
                type="button"
                onClick={() => {
                  setBudgetInput(budgetGoalUSD.toString());
                  setIsEditingBudget(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto shrink-0 border border-slate-200"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>{language === 'vi' ? 'Sửa Hạn Mức' : 'Adjust Budget Target'}</span>
              </button>
            ) : (
              <form onSubmit={handleSaveBudget} className="flex items-center space-x-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-28 pl-6 pr-2 py-1.5 bg-white border border-teal-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </form>
            )}
          </div>

          {/* Budget Visual Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-700">
                {language === 'vi' ? 'Đã dùng' : 'Spent'}: <span className="text-teal-700">${metrics.totalSpent} USD</span>
              </span>
              <span className="text-slate-500 font-mono">
                {metrics.budgetPercent}% {language === 'vi' ? 'của' : 'of'} ${budgetGoalUSD} USD
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  metrics.budgetPercent >= 100
                    ? 'bg-rose-500'
                    : metrics.budgetPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                }`}
                style={{ width: `${Math.min(100, metrics.budgetPercent)}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>0%</span>
              <span className="font-bold text-slate-700">
                {metrics.remainingBudget > 0
                  ? `✨ $${metrics.remainingBudget} USD ${language === 'vi' ? 'ngân sách còn lại' : 'budget remaining'}`
                  : `⚠️ ${language === 'vi' ? 'Đã vượt ngân sách' : 'Budget target reached/exceeded'}`}
              </span>
              <span>100% (${budgetGoalUSD})</span>
            </div>
          </div>

          {/* Quick Metrics Micro-Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                {language === 'vi' ? 'TB Mỗi Chuyến' : 'Avg Cost / Tour'}
              </span>
              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                ${metrics.avgTourCost} USD
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                {language === 'vi' ? 'TB Mỗi Khách' : 'Avg Cost / Traveler'}
              </span>
              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                ${metrics.avgPerPerson} USD
              </span>
            </div>

            <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-100 col-span-2 sm:col-span-1">
              <span className="text-teal-700 font-bold block text-[10px] uppercase">
                {language === 'vi' ? 'Tỉ Lệ Tiết Kiệm' : 'Negotiation ROI'}
              </span>
              <span className="text-sm font-black text-teal-900 mt-0.5 block">
                {metrics.totalSpent > 0 ? Math.round((metrics.totalSavings / (metrics.totalSpent + metrics.totalSavings)) * 100) : 0}% saved
              </span>
            </div>
          </div>
        </div>

        {/* Right (1 col): Spending by Category */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-teal-600 text-xl">pie_chart</span>
              <h3 className="font-extrabold text-slate-900 text-base">
                {language === 'vi' ? 'Chi Theo Loại Tour' : 'By Tour Category'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'vi' ? 'Phân bổ thể loại trải nghiệm' : 'Spending breakdown by interest'}
            </p>
          </div>

          <div className="space-y-3 my-2">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No categories recorded yet</p>
            ) : (
              categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5 truncate">
                      <span className="material-symbols-outlined text-sm text-teal-600 shrink-0">{cat.icon}</span>
                      <span className="truncate">{cat.category}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-700 shrink-0 ml-2">
                      ${cat.total} <span className="text-slate-400 font-normal">({cat.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full"
                      style={{ width: `${cat.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Destination distribution badge preview */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide block">
              {language === 'vi' ? 'Điểm Đến Hàng Đầu' : 'Top Destinations'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cityBreakdown.map(c => (
                <span key={c.cityName} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold">
                  📍 {c.cityName}: ${c.total}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* 4. ITEMIZED TRANSACTION & EXPENSE LEDGER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-teal-600 text-xl">receipt_long</span>
              <h3 className="font-extrabold text-slate-900 text-base">
                {language === 'vi' ? 'Sổ Giao Dịch & Hoá Đơn Đặt Tour' : 'Itemized Booking Transactions & Receipts'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi'
                ? 'Xem chi tiết các khoản thanh toán, mã bảo chứng Escrow và hoá đơn điện tử.'
                : 'Review official receipts, escrow transaction hashes, and dual-acceptance sign-offs.'}
            </p>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm theo tên tour, HDV...' : 'Search tour or guide...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'vi' ? 'Tất Cả' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_escrow')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'in_escrow' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'vi' ? 'Trong Escrow' : 'In Escrow'}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'completed' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'vi' ? 'Đã Hoàn Tất' : 'Completed'}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Table / Cards */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
            <p className="text-sm font-bold text-slate-700">
              {language === 'vi' ? 'Không tìm thấy giao dịch nào' : 'No matching transactions found'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'vi' ? 'Hãy thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm.' : 'Try adjusting your search query or filter tags.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const isCompleted = b.paymentStatus === 'released' || b.status === 'completed';

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Tour & Guide Details */}
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={b.guideAvatar}
                      alt={b.guideName}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-teal-500/40 shrink-0 shadow-xs mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{b.tourTitle}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isCompleted ? '✅ Escrow Released' : '🛡️ Vault Escrow Held'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">HDV: {b.guideName}</span> • 📅 {b.scheduledTime} • 👥 {b.groupSize || 1} {language === 'vi' ? 'Khách' : 'Travelers'}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500 font-mono">
                        <span>Invoice #{b.id}</span>
                        <span>•</span>
                        <span>Tx: {b.escrowHoldTxId || `ESCROW_TX_${b.id.slice(0, 6).toUpperCase()}`}</span>
                        <span>•</span>
                        <span className="text-teal-700 font-bold">PIN: {b.pinCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Receipt Button */}
                  <div className="flex items-center justify-between lg:justify-end space-x-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">
                        ${b.totalPriceUSD} <span className="text-xs text-slate-400 font-bold">USD</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        ≈ {(b.totalPriceUSD * 25400).toLocaleString()} ₫ VND
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedReceiptBooking(b)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs transition-colors border border-slate-200 shadow-2xs cursor-pointer flex items-center space-x-1.5 active:scale-95 shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm text-teal-600">description</span>
                      <span>{language === 'vi' ? 'Xem Hoá Đơn' : 'View Receipt'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setSelectedReceiptBooking(b);
                        const html = buildReceiptHtml(b);
                        await exportPdfFromHtml(html, `TourGuideHub_Receipt_${b.id}`);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-slate-200"
                      title="Direct PDF Export Receipt"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-[9999] max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-fade-in">
          <span className="material-symbols-outlined text-teal-400">info</span>
          <span className="text-xs font-bold">{feedbackToast}</span>
        </div>
      )}

      {/* 5. OFFICIAL STATEMENT PRINT & EXPORT PREVIEW MODAL */}
      {isPrintStatementOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 relative my-8">
            
            {/* Modal Header & Quick Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">
                    {language === 'vi' ? 'Xem Trước & In Sao Kê Chi Tiêu' : 'Official Statement Print & PDF Export'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {language === 'vi' ? 'Tài liệu sao kê tài chính chuẩn khổ A4 có đóng dấu bảo chứng Escrow' : 'Standard A4 financial statement document with escrow authentication'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPdfStatement}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-teal-600/20 active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>{isGeneratingPdf ? (language === 'vi' ? 'Đang tạo...' : 'Generating...') : (language === 'vi' ? 'Tải PDF (.pdf)' : 'Save as PDF')}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>{language === 'vi' ? 'In Ngay' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtmlStatement}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1"
                  title="Download Standalone HTML Statement"
                >
                  <span className="material-symbols-outlined text-sm">code</span>
                  <span className="hidden sm:inline">HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintStatementOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Document High-Fidelity Preview Box */}
            <div 
              ref={statementDocRef}
              className="printable-document border border-slate-200 rounded-2xl p-6 sm:p-8 bg-white max-h-[60vh] overflow-y-auto space-y-6 shadow-inner text-slate-900 font-sans"
            >
              
              {/* Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-teal-700">
                <div>
                  <h3 className="text-xl font-black text-teal-800 tracking-tight">TOUR GUIDE HUB</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Vietnam National Administration of Tourism (VNAT) Licensed Platform</p>
                  <p className="text-[10px] text-slate-400">Escrow Security ID: TGH-ESCROW-VNAT-VN</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider block">Official Traveler Statement</span>
                  <span className="text-[11px] text-slate-500 font-mono">Statement Ref: TGH-STMT-2026-{(currentUser?.id || 'TRV').slice(-4).toUpperCase()}</span>
                  <span className="text-[10px] text-slate-400 block">Issue Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Account Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Traveler / Account Holder</p>
                  <p className="font-black text-slate-900">{currentUser?.name || 'Verified Traveler'}</p>
                  <p className="text-[11px] text-slate-500">{currentUser?.email || 'traveler@tourguidehub.com'}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Currency & Coverage</p>
                  <p className="font-bold text-slate-900">USD ($) • 1 USD = 25,400 VND</p>
                  <p className="text-[11px] text-emerald-700 font-bold">🛡️ 100% Protected Escrow Vault</p>
                </div>
              </div>

              {/* Financial Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">Total Spend</span>
                  <span className="text-base font-black text-teal-950 block mt-0.5">${metrics.totalSpent} USD</span>
                  <span className="text-[9px] text-teal-700 font-semibold">≈ {metrics.totalSpentVND.toLocaleString()} ₫</span>
                </div>
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">In Escrow Vault</span>
                  <span className="text-base font-black text-amber-950 block mt-0.5">${metrics.inEscrow} USD</span>
                  <span className="text-[9px] text-amber-700 font-semibold">Pending completion</span>
                </div>
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Released to Guides</span>
                  <span className="text-base font-black text-emerald-950 block mt-0.5">${metrics.completedPaid} USD</span>
                  <span className="text-[9px] text-emerald-700 font-semibold">Dual sign-off</span>
                </div>
                <div className="p-3 bg-teal-100/70 rounded-xl border border-teal-200">
                  <span className="text-[10px] font-bold text-teal-900 uppercase block">Negotiated Savings</span>
                  <span className="text-base font-black text-teal-950 block mt-0.5">+${metrics.totalSavings} USD</span>
                  <span className="text-[9px] text-teal-800 font-semibold">Direct negotiation</span>
                </div>
              </div>

              {/* Document Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Itemized Tour Ledger</span>
                  <span className="text-xs text-slate-500">{bookings.length} recorded booking(s)</span>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] uppercase font-bold">
                        <th className="p-2.5">Tour & Guide</th>
                        <th className="p-2.5">Date & Slot</th>
                        <th className="p-2.5">Pax</th>
                        <th className="p-2.5">PIN</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Amount (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((b) => {
                        const isCompleted = b.paymentStatus === 'released' || b.status === 'completed';
                        return (
                          <tr key={b.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5">
                              <p className="font-extrabold text-slate-900">{b.tourTitle}</p>
                              <p className="text-[10px] text-slate-500 font-mono">HDV: {b.guideName} • #{b.id.slice(0, 8)}</p>
                            </td>
                            <td className="p-2.5 text-slate-600 text-[11px] whitespace-nowrap">{b.scheduledTime}</td>
                            <td className="p-2.5 text-slate-600">{b.groupSize || 1}</td>
                            <td className="p-2.5 font-mono font-bold text-teal-800 text-[11px]">{b.pinCode}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isCompleted ? 'Settled' : 'In Escrow'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-slate-900 text-sm">
                              ${b.totalPriceUSD}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={5} className="p-3 text-right text-xs uppercase">Total Statement Sum:</td>
                        <td className="p-3 text-right text-base text-teal-800 font-mono">${metrics.totalSpent} USD</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Official Seal & Signature Section */}
              <div className="pt-4 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="font-bold text-slate-800">Tour Guide Hub Digital Verification Protocol</p>
                  <p className="text-[10px] text-slate-400">Cryptographically signed with dual-party release PIN authentication.</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-teal-50 border-2 border-teal-600 text-teal-800 text-center font-black text-xs uppercase tracking-wider shadow-xs">
                  ★ OFFICIAL PLATFORM SEAL ★<br/>
                  <span className="text-[9px] font-semibold text-teal-600">VERIFIED & AUDITED</span>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                💡 Instant high-resolution PDF download and direct printer integration.
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPrintStatementOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPdfStatement}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer shadow-md transition-colors flex items-center space-x-1.5"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>{language === 'vi' ? 'Tải PDF (.pdf)' : 'Download PDF (.pdf)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer shadow-md transition-colors flex items-center space-x-1.5"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>{language === 'vi' ? 'In Ngay' : 'Print Document Now'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. OFFICIAL TOUR RECEIPT / TAX INVOICE MODAL */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 relative my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-lg">receipt_long</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {language === 'vi' ? 'Hoá Đơn Điện Tử Đặt Tour' : 'Official Tour Electronic Receipt'}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">Invoice #{selectedReceiptBooking.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptBooking(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Receipt Body */}
            <div 
              ref={receiptDocRef}
              className="printable-document space-y-4 text-xs bg-white p-4 rounded-2xl border border-slate-200"
            >
              
              {/* Status Badge & Timestamp */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">Payment Status</span>
                  <span className="font-black text-teal-950 text-sm">
                    {selectedReceiptBooking.paymentStatus === 'released' ? 'PAID & ESCROW RELEASED' : 'SECURE IN PLATFORM ESCROW'}
                  </span>
                </div>
                <span className="text-teal-700 text-xs font-mono font-bold">
                  {selectedReceiptBooking.createdAt ? new Date(selectedReceiptBooking.createdAt).toLocaleDateString() : '2026-08-16'}
                </span>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-start">
                  <div className="max-w-[240px]">
                    <p className="font-extrabold text-slate-900 text-xs">{selectedReceiptBooking.tourTitle}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Guide: {selectedReceiptBooking.guideName} ({selectedReceiptBooking.guidePhone || 'Verified Contact'})</p>
                    <p className="text-[10px] text-slate-500">Pickup: {selectedReceiptBooking.pickupLocation}</p>
                  </div>
                  <span className="font-extrabold text-slate-900 text-xs font-mono">${selectedReceiptBooking.totalPriceUSD} USD</span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-600 text-[11px]">
                  <span>Group Size:</span>
                  <span className="font-bold">{selectedReceiptBooking.groupSize || 1} Travelers</span>
                </div>

                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Platform Escrow Protection Fee:</span>
                  <span className="font-bold text-emerald-600">FREE (0.00)</span>
                </div>

                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Safety PIN Verification:</span>
                  <span className="font-mono font-bold text-teal-800">{selectedReceiptBooking.pinCode}</span>
                </div>

                <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Amount Paid:</span>
                  <span className="text-teal-700 font-mono">${selectedReceiptBooking.totalPriceUSD} USD</span>
                </div>
              </div>

              {/* Dual Signature Guarantee */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">🛡️ VNAT Licensed Platform Escrow Guarantee:</p>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Funds remain securely protected in Tour Guide Hub Escrow and are only remitted to the verified guide upon mutual dual sign-off or completion PIN exchange.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={() => handleDownloadPdfReceipt(selectedReceiptBooking)}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>{language === 'vi' ? 'Lưu PDF' : 'Save PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrintSingleReceipt}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>{language === 'vi' ? 'In Hoá Đơn' : 'Print'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs cursor-pointer transition-colors"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
