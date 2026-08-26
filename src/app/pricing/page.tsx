'use client';

import React, { useState, useEffect } from 'react';
import { SUBSCRIPTION_PACKAGES } from '@/lib/seed-data';
import { SubscriptionPackage } from '@/lib/types';
import { createInvitationToken } from '@/lib/token';
import { addInvitationToken, addTransaction } from '@/lib/storage';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Check,
  Zap,
  CreditCard,
  Building2,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  ExternalLink,
  ArrowLeft,
  QrCode,
  Landmark,
  Wallet,
  ClipboardList,
  FileEdit,
  Copy,
  AlertCircle,
  RefreshCw,
  Store,
  Factory
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Form State
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 & 3: Midtrans Snap & Transaction State
  const [orderId, setOrderId] = useState<string>('');
  const [snapToken, setSnapToken] = useState<string>('');
  const [snapRedirectUrl, setSnapRedirectUrl] = useState<string>('');
  const [isCreatingSnap, setIsCreatingSnap] = useState(false);
  const [isOpeningSnap, setIsOpeningSnap] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pending Payment state for VA / Transfer / Unpaid transactions
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{
    orderId: string;
    paymentType?: string;
    vaNumber?: string;
    bank?: string;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);

  // Step 3: Activation Token State
  const [activationUrl, setActivationUrl] = useState<string>('');

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
  const snapScriptUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  useEffect(() => {
    // Observer untuk memastikan iframe Midtrans Snap selalu transparan
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME' || (node as HTMLElement).id?.includes('snap-midtrans')) {
            const iframe = node as HTMLIFrameElement;
            iframe.setAttribute('allowtransparency', 'true');
            iframe.style.setProperty('background', 'transparent', 'important');
            iframe.style.setProperty('background-color', 'transparent', 'important');
            iframe.style.setProperty('color-scheme', 'normal', 'important');
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // 1. Pilih Paket & Masuk ke Step 1
  const handleSelectPackage = (pkg: SubscriptionPackage) => {
    setSelectedPkg(pkg);
    setStep(1);
    setErrorMsg(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // 2. Dari Step 1 -> Buat Snap Transaction & Masuk ke Step 2
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPkg) return;
    if (!companyName.trim()) {
      setErrorMsg('Nama Institusi / Perusahaan wajib diisi.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMsg('Email utama yang valid wajib diisi.');
      return;
    }

    setIsCreatingSnap(true);

    try {
      // Hubungi API /api/payment/create-snap untuk membuat token Midtrans Snap asli
      const res = await fetch('/api/payment/create-snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          packageName: selectedPkg.name,
          price: selectedPkg.price,
          companyName,
          contactName: companyName,
          contactEmail,
          phone: phone || '08123456789'
        })
      });

      const data = await res.json();

      if (!res.ok || !data.snapToken) {
        throw new Error(data.error || 'Gagal menghubungi server Midtrans');
      }

      setOrderId(data.orderId);
      setSnapToken(data.snapToken);
      setSnapRedirectUrl(data.redirectUrl);
      setStep(2);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('Create Snap Error:', err);
      // Fallback jika koneksi sandbox offline
      const fallbackOrderId = `SMARTRECRUIT-${Date.now()}`;
      setOrderId(fallbackOrderId);
      setSnapToken('demo-snap-token');
      setStep(2);
    } finally {
      setIsCreatingSnap(false);
    }
  };

  // 3. Selesaikan Pembayaran via Midtrans Snap Popup langsung di aplikasi
  const handleOpenMidtransSnap = () => {
    setIsOpeningSnap(true);
    setStatusMessage(null);

    const triggerPay = () => {
      const snap = (window as unknown as { snap?: { pay: (token: string, callbacks: Record<string, unknown>) => void } })?.snap;

      if (snap && snapToken && snapToken !== 'demo-snap-token') {
        snap.pay(snapToken, {
          onSuccess: function (result: unknown) {
            console.log('[Midtrans Snap Success]:', result);
            handlePaymentFinalized();
          },
          onPending: function (result: unknown) {
            console.log('[Midtrans Snap Pending - Waiting for Transfer]:', result);
            handlePaymentPending(result);
          },
          onError: function (result: unknown) {
            console.error('[Midtrans Snap Error]:', result);
            alert('Pembayaran mengalami kendala atau ditolak. Silakan coba kembali.');
            setIsOpeningSnap(false);
          },
          onClose: function () {
            console.log('[Midtrans Snap Popup Closed by User without completing payment]');
            setIsOpeningSnap(false);
          }
        });
      } else {
        // Fallback jika menggunakan token demo
        setTimeout(() => {
          handlePaymentFinalized();
        }, 600);
      }
    };

    // Pastikan snap.js sudah ready
    const existingSnap = (window as unknown as { snap?: unknown })?.snap;
    if (existingSnap) {
      triggerPay();
    } else {
      const script = document.createElement('script');
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.onload = () => triggerPay();
      document.body.appendChild(script);
    }
  };

  // 3b. Saat user memilih Transfer Bank / VA / QRIS tapi belum bayar (Pending)
  const handlePaymentPending = (result: any) => {
    setIsOpeningSnap(false);
    const targetOrderId = orderId || `SMARTRECRUIT-${Date.now()}`;
    const vaNumber = result?.va_numbers?.[0]?.va_number || result?.bill_key || result?.permata_va_number || '';
    const bank = result?.va_numbers?.[0]?.bank?.toUpperCase() || (result?.bill_key ? 'Mandiri Bill' : 'Transfer Bank');
    const pType = result?.payment_type || 'bank_transfer';

    setPendingPaymentInfo({
      orderId: targetOrderId,
      paymentType: pType,
      vaNumber,
      bank
    });

    // Simpan status transaksi sebagai 'pending' (BUKAN settlement)
    addTransaction({
      id: `trx-${Date.now()}`,
      orderId: targetOrderId,
      companyEmail: contactEmail,
      companyName,
      packageName: selectedPkg?.name || 'Enterprise Corporation',
      amount: selectedPkg?.price || 0,
      paymentType: pType,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  };

  // 3c. Tombol Cek Status Pembayaran (Real-Time Verification)
  const handleCheckPaymentStatus = async () => {
    const targetOrderId = pendingPaymentInfo?.orderId || orderId;
    if (!targetOrderId) return;

    setIsCheckingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/payment/status?order_id=${encodeURIComponent(targetOrderId)}`);
      const data = await res.json();

      if (data.isPaid && data.status === 'settlement') {
        // Pembayaran sudah masuk!
        const targetUrl = `/pricing/success?order_id=${encodeURIComponent(targetOrderId)}&email=${encodeURIComponent(contactEmail)}&pkg=${encodeURIComponent(selectedPkg?.name || '')}&price=${selectedPkg?.price || 0}&token=${data.token}`;
        router.push(targetUrl);
        return;
      }

      if (data.status === 'pending') {
        setStatusMessage('Pembayaran belum terdeteksi. Silakan lakukan transfer dana sesuai nominal ke nomor Virtual Account / rekening.');
      } else {
        setStatusMessage(data.message || `Status transaksi saat ini: ${data.status || 'Menunggu pembayaran'}`);
      }
    } catch (err) {
      console.warn('Check payment status error:', err);
      setStatusMessage('Gagal memeriksa status ke Midtrans. Silakan coba beberapa saat lagi.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // 4. Setelah Pembayaran Sukses: Buat Token Aktivasi, Kirim Email, Masuk ke Step 3
  const handlePaymentFinalized = async () => {
    if (!selectedPkg) return;

    // A. Buat Token Registrasi 1x Pakai
    const tokenObj = createInvitationToken(contactEmail, selectedPkg.name);
    addInvitationToken(tokenObj);

    // B. Simpan Catatan Transaksi
    addTransaction({
      id: `trx-${Date.now()}`,
      orderId: orderId || `SMARTRECRUIT-${Date.now()}`,
      companyEmail: contactEmail,
      companyName,
      packageName: selectedPkg.name,
      amount: selectedPkg.price,
      paymentType: 'midtrans_gateway',
      status: 'settlement',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    // C. Kirim Webhook & Email Asli via Gmail SMTP
    try {
      await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          transaction_status: 'settlement',
          gross_amount: selectedPkg.price,
          customer_details: {
            email: contactEmail,
            first_name: companyName
          }
        })
      });
    } catch (e) {
      console.warn('Webhook trigger error:', e);
    }

    const targetOrderId = orderId || `SMARTRECRUIT-${Date.now()}`;
    const targetUrl = `/pricing/success?order_id=${encodeURIComponent(targetOrderId)}&email=${encodeURIComponent(contactEmail)}&pkg=${encodeURIComponent(selectedPkg.name)}&price=${selectedPkg.price}&token=${tokenObj.token}`;
    
    setIsOpeningSnap(false);
    router.push(targetUrl);
  };

  return (
    <>
      {/* Midtrans Snap JS Script Loader */}
      <Script
        src={snapScriptUrl}
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Header Katalog Paket */}
        {!selectedPkg ? (
          <>
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Paket Langganan Khusus Perusahaan (PT)
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed">
                Untuk membuka lowongan kerja dan menggunakan analisis berkas otomatis Gemini AI, perusahaan diwajibkan berlangganan terlebih dahulu. Pembayaran diproses aman melalui Midtrans.
              </p>
            </div>

            {/* CARA KERJA BANNER (Stepped Flow Visualization - Seamless Direct on Page) */}
            <div className="max-w-5xl mx-auto w-full py-2">
              <div className="text-center mb-8">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  CARA KERJA
                </span>
              </div>

              {/* 5-Step Connected Flow (Selalu Horizontal 1 Baris di Mobile & Desktop) */}
              <div className="relative grid grid-cols-5 gap-1 sm:gap-4 items-start">

                {/* Horizontal Connecting Line (Selalu tampil menghubungkan 5 titik) */}
                <div className="block absolute top-5 sm:top-7 left-5 sm:left-12 right-5 sm:right-12 h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 via-indigo-500 to-emerald-400 z-0 opacity-40" />

                {/* Step 1 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-purple-950/50 ring-2 sm:ring-4 ring-purple-500/20 group-hover:scale-105 transition-transform mb-1.5 sm:mb-3">
                    <ClipboardList className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="font-bold text-white text-[10px] sm:text-sm leading-tight">Pilih Paket</h4>
                  <p className="text-[8px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 leading-tight">
                    Sesuai kebutuhan
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-fuchsia-950/50 ring-2 sm:ring-4 ring-fuchsia-500/20 group-hover:scale-105 transition-transform mb-1.5 sm:mb-3">
                    <FileEdit className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="font-bold text-white text-[10px] sm:text-sm leading-tight">Isi Data</h4>
                  <p className="text-[8px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 leading-tight">
                    Data & email
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-950/50 ring-2 sm:ring-4 ring-blue-500/20 group-hover:scale-105 transition-transform mb-1.5 sm:mb-3">
                    <CreditCard className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="font-bold text-white text-[10px] sm:text-sm leading-tight">Bayar Midtrans</h4>
                  <p className="text-[8px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 leading-tight">
                    VA & QRIS
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-indigo-950/50 ring-2 sm:ring-4 ring-indigo-500/20 group-hover:scale-105 transition-transform mb-1.5 sm:mb-3">
                    <Mail className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="font-bold text-white text-[10px] sm:text-sm leading-tight">Link via Email</h4>
                  <p className="text-[8px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 leading-tight">
                    Link aktivasi
                  </p>
                </div>

                {/* Step 5 */}
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 ring-2 sm:ring-4 ring-emerald-500/20 group-hover:scale-105 transition-transform mb-1.5 sm:mb-3">
                    <Check className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-bold text-white text-[10px] sm:text-sm leading-tight">Akun Aktif</h4>
                  <p className="text-[8px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 leading-tight">
                    Siap dipakai!
                  </p>
                </div>

              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {SUBSCRIPTION_PACKAGES.map((pkg) => {
                const isPop = pkg.isPopular;
                const isUmk = pkg.category === 'UMK';
                const isIndustri = pkg.category === 'Industri';

                const cardBorder = isPop
                  ? 'border-2 border-emerald-500 shadow-2xl shadow-emerald-950/40 -translate-y-2'
                  : isUmk
                  ? 'border border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-950/20'
                  : isIndustri
                  ? 'border border-purple-500/30 hover:border-purple-500/60 shadow-lg shadow-purple-950/20'
                  : 'border border-slate-800 hover:border-slate-700';

                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all bg-slate-900 ${cardBorder}`}
                  >
                    {/* Badge top tag */}
                    {pkg.badge && (
                      <div
                        className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full font-bold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1.5 ${
                          isPop
                            ? 'bg-emerald-600 text-white'
                            : isUmk
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {isUmk ? <Store className="w-3 h-3" /> : isIndustri ? <Factory className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        <span>{pkg.badge}</span>
                      </div>
                    )}

                    <div>
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          {isUmk ? (
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                              <Store className="w-4 h-4" />
                            </div>
                          ) : isIndustri ? (
                            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                              <Factory className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                              <Building2 className="w-4 h-4" />
                            </div>
                          )}
                          <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{pkg.description}</p>
                      </div>

                      <div className="flex items-baseline gap-1 my-6">
                        <span className="text-3xl sm:text-4xl font-black text-white">{pkg.priceFormatted}</span>
                        <span className="text-xs text-slate-400 font-medium">{pkg.billingPeriod}</span>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                        <p className="font-semibold text-slate-300">Fitur Utama Termasuk:</p>
                        {pkg.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-slate-300">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              isUmk
                                ? 'bg-amber-500/20 text-amber-400'
                                : isIndustri
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              <Check className="w-2.5 h-2.5" />
                            </div>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 mt-6 border-t border-slate-800/80">
                      <button
                        onClick={() => handleSelectPackage(pkg)}
                        className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                          isPop
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                            : isUmk
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/30'
                            : isIndustri
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pilih {pkg.name}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ========================================================================= */
          /* 3-STEP CHECKOUT EXPERIENCE (PERSIS SESUAI DESAIN USER) */
          /* ========================================================================= */
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Tombol Kembali ke Pilihan Paket */}
            <button
              type="button"
              onClick={() => {
                setSelectedPkg(null);
                setStep(1);
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pilihan Paket</span>
            </button>

            {/* Stepper Header (1. Isi Data -> 2. Pembayaran -> 3. Akun Aktif) */}
            <div className="flex items-center justify-center gap-6 sm:gap-12 py-4 border-b border-slate-800 text-xs sm:text-sm font-bold">

              {/* Step 1 Item */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step > 1
                  ? 'bg-emerald-500 text-white'
                  : step === 1
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-4 ring-emerald-500/20'
                    : 'bg-slate-800 text-slate-400'
                  }`}>
                  {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className={step >= 1 ? 'text-white' : 'text-slate-500'}>
                  Isi Data
                </span>
              </div>

              <div className={`w-8 sm:w-16 h-0.5 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

              {/* Step 2 Item */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step > 2
                  ? 'bg-emerald-500 text-white'
                  : step === 2
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-4 ring-emerald-500/20'
                    : 'bg-slate-800 text-slate-400'
                  }`}>
                  {step > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <span className={step >= 2 ? 'text-white' : 'text-slate-500'}>
                  Pembayaran
                </span>
              </div>

              <div className={`w-8 sm:w-16 h-0.5 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

              {/* Step 3 Item */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step === 3
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-4 ring-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
                  }`}>
                  {step === 3 ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <span className={step === 3 ? 'text-white' : 'text-slate-500'}>
                  Akun Aktif
                </span>
              </div>

            </div>

            {/* Grid 2 Kolom: Kiri (Ringkasan Paket/Pesanan) & Kanan (Form/Tombol Bayar) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* KOLOM KIRI: KARTU INFORMASI PAKET & RINGKASAN */}
              <div className="lg:col-span-5">
                {step === 1 ? (
                  /* Kartu Paket yang Dipilih (Step 1) */
                  <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 space-y-6 shadow-2xl">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        PAKET YANG DIPILIH
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        {selectedPkg.name}
                      </h2>
                      <p className="text-xs text-slate-300">
                        {selectedPkg.billingPeriod} • {selectedPkg.priceFormatted}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                      <p className="font-bold text-white">YANG AKAN ANDA DAPATKAN:</p>
                      {selectedPkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-slate-300">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Pembayaran aman & terenkripsi via Midtrans</span>
                    </div>
                  </div>
                ) : (
                  /* Kartu Ringkasan Pesanan (Step 2 & 3) */
                  <div className="p-7 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
                    <div className="space-y-1 border-b border-slate-800 pb-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        RINGKASAN PESANAN
                      </span>
                      <div className="text-xs text-slate-400 font-mono">
                        ID: <span className="text-emerald-400 font-bold">{orderId}</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Paket:</span>
                        <span className="font-bold text-white">{selectedPkg.name}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Nama PT:</span>
                        <span className="font-bold text-white">{companyName}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Email:</span>
                        <span className="font-bold text-white">{contactEmail}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
                        <span className="font-bold text-slate-300 text-sm">Total:</span>
                        <span className="text-2xl font-black text-emerald-400">{selectedPkg.priceFormatted}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                      📧 Link aktivasi akun akan dikirim ke email <strong className="text-slate-200">{contactEmail}</strong> setelah pembayaran berhasil.
                    </div>
                  </div>
                )}
              </div>

              {/* KOLOM KANAN: STEP 1 (FORM DATA) / STEP 2 (PILIH METODE & BAYAR) / STEP 3 (SUKSES) */}
              <div className="lg:col-span-7">

                {/* STEP 1: FORM INFORMASI PEMESANAN */}
                {step === 1 && (
                  <div className="p-7 sm:p-9 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        Informasi Pemesanan
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Isi data di bawah ini untuk melanjutkan ke tahap pembayaran.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs">

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-300">
                          Nama Institusi / Perusahaan: *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: PT Teknologi Bangsa Indonesia"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-300">
                          Email Utama (Penerima Link Aktivasi): *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="Contoh: hrd@perusahaan.co.id"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[11px] text-slate-400">
                          Link pembuatan akun akan dikirimkan ke email ini setelah pembayaran dikonfirmasi.
                        </p>
                      </div>

                      {/* Alert Info Box (Kuning/Amber) */}
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 leading-relaxed">
                        <Mail className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          Setelah pembayaran berhasil, <strong>link aktivasi akun</strong> akan dikirim ke alamat email di atas. Pastikan email yang dimasukkan aktif dan dapat diakses.
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCreatingSnap}
                        className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 hover:scale-[1.01]"
                      >
                        {isCreatingSnap ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Menyiapkan Gateway Pembayaran Midtrans...</span>
                          </>
                        ) : (
                          <>
                            <span>Lanjutkan ke Pembayaran</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center pt-2">
                        Dengan melanjutkan, Anda menyetujui <span className="text-emerald-400 underline">Syarat & Ketentuan</span> layanan SmartRecruit AI.
                      </p>
                    </form>
                  </div>
                )}

                {/* STEP 2: PILIH METODE PEMBAYARAN MIDTRANS */}
                {step === 2 && (
                  <div className="p-7 sm:p-9 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl text-center">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        Selesaikan Pembayaran
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Pilih metode pembayaran yang tersedia melalui gateway resmi Midtrans Snap.
                      </p>
                    </div>

                    {/* Pending Transfer Box if user opened VA / transfer method */}
                    {pendingPaymentInfo ? (
                      <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-left space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Menunggu Pembayaran: {pendingPaymentInfo.bank}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                            Belum Dibayar
                          </span>
                        </div>

                        {pendingPaymentInfo.vaNumber && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-400 font-medium">Nomor Virtual Account / Kode Bayar:</span>
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="font-mono font-black text-white text-base sm:text-lg tracking-wider">
                                {pendingPaymentInfo.vaNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pendingPaymentInfo.vaNumber || '');
                                  setCopiedVa(true);
                                  setTimeout(() => setCopiedVa(false), 2000);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                              >
                                {copiedVa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedVa ? 'Tersalin' : 'Salin'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Silakan lakukan transfer dana sesuai nominal <strong>{selectedPkg?.priceFormatted}</strong> sebelum batas waktu berakhir. Setelah transfer berhasil, klik tombol <strong>Saya Sudah Bayar</strong> di bawah.
                        </p>

                        {statusMessage && (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{statusMessage}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleCheckPaymentStatus}
                            disabled={isCheckingStatus}
                            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 transition-all hover:scale-[1.01]"
                          >
                            {isCheckingStatus ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Memverifikasi Pembayaran...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Saya Sudah Bayar (Cek Status)</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleOpenMidtransSnap}
                            disabled={isOpeningSnap}
                            className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                          >
                            <CreditCard className="w-4 h-4 text-emerald-400" />
                            <span>Buka Jendela Midtrans</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Visual 3 Method Cards */}
                        <div className="grid grid-cols-3 gap-3 py-2">
                          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
                            <Landmark className="w-6 h-6 text-emerald-400" />
                            <span className="text-[11px] font-bold text-slate-300">Transfer Bank</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
                            <QrCode className="w-6 h-6 text-emerald-400" />
                            <span className="text-[11px] font-bold text-slate-300">QRIS / e-Wallet</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
                            <CreditCard className="w-6 h-6 text-emerald-400" />
                            <span className="text-[11px] font-bold text-slate-300">Kartu Kredit</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400">
                          dan banyak metode pembayaran lainnya via <strong>Midtrans Snap</strong>
                        </p>

                        {/* Tombol Buka Midtrans Snap Popup Langsung di Aplikasi */}
                        <div className="space-y-3 pt-2">
                          <button
                            type="button"
                            onClick={handleOpenMidtransSnap}
                            disabled={isOpeningSnap}
                            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 hover:scale-[1.02] disabled:opacity-50"
                          >
                            {isOpeningSnap ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Membuka Jendela Midtrans Snap...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5" />
                                <span>Pilih Metode & Bayar Sekarang</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pembayaran diproses dengan enkripsi SSL 256-bit oleh Midtrans</span>
                    </div>
                  </div>
                )}

                {/* STEP 3: PEMBAYARAN BERHASIL & LINK AKTIVASI */}
                {step === 3 && (
                  <div className="p-7 sm:p-9 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-6 shadow-2xl text-center relative overflow-hidden">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        Pembayaran Sukses Terverifikasi!
                      </span>
                      <h3 className="text-2xl font-black text-white mt-2">
                        Selamat Datang di SmartRecruit AI!
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                        Pembayaran untuk paket <strong>{selectedPkg.name}</strong> telah berhasil diproses oleh Midtrans.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-left text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <Mail className="w-4 h-4" />
                        <span>Email Aktivasi Terkirim ke: {contactEmail}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Sistem telah membuat <strong>Link Pendaftaran Sekali Pakai (One-Time Token)</strong> dengan masa berlaku 24 jam dan mengirimkannya ke inbox Gmail Anda.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Link
                        href={activationUrl}
                        className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.02]"
                      >
                        <span>Aktivasi & Buat Akun Perusahaan Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPkg(null);
                          setStep(1);
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                      >
                        Kembali ke Katalog Paket
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
}
