'use client';

import React, { useState } from 'react';
import { SUBSCRIPTION_PACKAGES } from '@/lib/seed-data';
import { SubscriptionPackage } from '@/lib/types';
import { createInvitationToken } from '@/lib/token';
import { addInvitationToken, addTransaction } from '@/lib/storage';
import Link from 'next/link';
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
  ExternalLink
} from 'lucide-react';

export default function PricingPage() {
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bca_va' | 'credit_card'>('qris');

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedTokenUrl, setGeneratedTokenUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');

  const handleOpenCheckout = (pkg: SubscriptionPackage) => {
    setSelectedPkg(pkg);
    setPaymentSuccess(false);
    setGeneratedTokenUrl(null);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !contactEmail.trim() || !companyName.trim()) {
      alert('Harap lengkapi semua field formulir langganan.');
      return;
    }

    setIsProcessing(true);

    const generatedOrderId = `ORD-${Date.now()}`;
    setOrderId(generatedOrderId);

    try {
      // 1. Call Snap API / Simulation
      const res = await fetch('/api/payment/create-snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          packageName: selectedPkg.name,
          price: selectedPkg.price,
          companyName,
          contactName: contactName || companyName,
          contactEmail,
          phone
        })
      });

      const snapData = await res.json();

      // 2. Generate One-Time Token
      const tokenObj = createInvitationToken(contactEmail, selectedPkg.name);
      addInvitationToken(tokenObj);

      // 3. Record transaction in storage
      addTransaction({
        id: `trx-${Date.now()}`,
        orderId: generatedOrderId,
        companyEmail: contactEmail,
        companyName,
        packageName: selectedPkg.name,
        amount: selectedPkg.price,
        paymentType: paymentMethod,
        status: 'settlement',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // 4. Trigger Webhook & Email Simulation
      await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: generatedOrderId,
          transaction_status: 'settlement',
          gross_amount: selectedPkg.price,
          customer_details: {
            email: contactEmail,
            first_name: contactName || companyName
          }
        })
      });

      const regUrl = `/auth/company-register?token=${tokenObj.token}&email=${encodeURIComponent(contactEmail)}`;
      setGeneratedTokenUrl(regUrl);
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Payment flow error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Sistem Langganan Perusahaan (Midtrans + Resend)</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Paket Langganan Khusus Perusahaan (PT)
        </h1>
        
        <p className="text-sm text-slate-400 leading-relaxed">
          Untuk membuka lowongan kerja dan menggunakan analisis berkas otomatis AI, perusahaan diwajibkan berlangganan terlebih dahulu. Setelah pembayaran Midtrans berhasil, link pendaftaran sekali pakai akan otomatis dikirimkan ke email Anda.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {SUBSCRIPTION_PACKAGES.map((pkg) => {
          const isPop = pkg.isPopular;
          return (
            <div
              key={pkg.id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                isPop
                  ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/40 -translate-y-2'
                  : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isPop && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-md">
                  Paling Populer
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
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
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenCheckout(pkg)}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isPop
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pilih & Bayar Midtrans</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHECKOUT MODAL (MIDTRANS + RESEND SIMULATION) */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Checkout Langganan PT
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {selectedPkg.name} ({selectedPkg.priceFormatted})
                </h3>
              </div>
              <button
                onClick={() => setSelectedPkg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {!paymentSuccess ? (
              <form onSubmit={handlePay} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Nama Resmi Perusahaan (PT/CV): *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Teknologi Inovasi Nusantara"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Nama PIC / HRD: *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">No. WhatsApp/HP:</label>
                    <input
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Email Perusahaan (Penerima Link Token): *</label>
                  <input
                    type="email"
                    required
                    placeholder="recruitment@perusahaan.co.id"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-amber-400">
                    *Link pendaftaran akun perusahaan 1x pakai akan dikirim ke email ini via Resend.
                  </p>
                </div>

                {/* Midtrans Payment Channels */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="font-semibold text-slate-300">Metode Pembayaran Midtrans:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'qris', name: 'QRIS (Gopay/OVO)' },
                      { id: 'bca_va', name: 'Virtual Account' },
                      { id: 'credit_card', name: 'Kartu Kredit' }
                    ].map((pm) => (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                          paymentMethod === pm.id
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {pm.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Pembayaran Midtrans...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Bayar Sekarang ({selectedPkg.priceFormatted})</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            ) : (
              /* PAYMENT SUCCESS & TOKEN INVITATION */
              <div className="space-y-5 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Pembayaran Sukses Terverifikasi!</h4>
                  <p className="text-xs text-slate-300">
                    Order ID: <span className="font-mono text-emerald-400">{orderId}</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <Mail className="w-4 h-4" />
                    <span>Email Resend Terkirim ke: {contactEmail}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Sistem telah membuat <strong>Link Pendaftaran Sekali Pakai (One-Time Token)</strong> dengan masa berlaku 24 jam.
                  </p>
                  
                  {generatedTokenUrl && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <span className="text-slate-300 font-semibold">Tautan Akses Langsung (Simulasi Email):</span>
                      <Link
                        href={generatedTokenUrl}
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        <span>Aktivasi Akun Perusahaan Sekarang</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPkg(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Tutup Jendela
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
