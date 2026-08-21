'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Check,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  Sparkles,
  Home
} from 'lucide-react';
import { createInvitationToken } from '@/lib/token';
import { addInvitationToken, addTransaction, findInvitationToken, initializeStorage } from '@/lib/storage';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [priceFormatted, setPriceFormatted] = useState<string>('');
  const [activationUrl, setActivationUrl] = useState<string>('');
  const [isTokenConsumed, setIsTokenConsumed] = useState<boolean>(false);

  useEffect(() => {
    // 1. Confetti trigger
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });
    } catch {}

    // 2. Extract Data from Search Params or Session Storage
    const paramOrderId = searchParams.get('order_id') || `SMARTRECRUIT-${Date.now()}`;
    const paramEmail = searchParams.get('email');
    const paramPkg = searchParams.get('pkg');
    const paramPrice = searchParams.get('price');
    const paramToken = searchParams.get('token');

    let resolvedEmail = paramEmail || '';
    let resolvedPkg = paramPkg || 'Professional HR ATS';
    let resolvedPrice = paramPrice ? `Rp ${Number(paramPrice).toLocaleString('id-ID')}` : 'Rp 1.299.000';
    let resolvedToken = paramToken || '';

    // Check sessionStorage if params are incomplete (e.g. from Midtrans redirect)
    if (typeof window !== 'undefined') {
      const pendingStr = sessionStorage.getItem('smartrecruit_pending_payment');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (!resolvedEmail && pending.contactEmail) resolvedEmail = pending.contactEmail;
          if ((!resolvedPkg || resolvedPkg === 'Professional HR ATS') && pending.packageName) resolvedPkg = pending.packageName;
          if (pending.priceFormatted) resolvedPrice = pending.priceFormatted;

          // Generate or fetch token
          if (!resolvedToken) {
            const tokenObj = createInvitationToken(pending.contactEmail, pending.packageName);
            addInvitationToken(tokenObj);
            resolvedToken = tokenObj.token;

            // Record transaction
            addTransaction({
              id: `trx-${Date.now()}`,
              orderId: paramOrderId,
              companyEmail: pending.contactEmail,
              companyName: pending.companyName,
              packageName: pending.packageName,
              amount: pending.price,
              paymentType: 'midtrans_gateway',
              status: 'settlement',
              paidAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });

            // Trigger Email Webhook
            fetch('/api/payment/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: paramOrderId,
                transaction_status: 'settlement',
                gross_amount: pending.price,
                customer_details: {
                  email: pending.contactEmail,
                  first_name: pending.companyName
                }
              })
            }).catch(() => {});
          }

          sessionStorage.removeItem('smartrecruit_pending_payment');
        } catch (e) {
          console.warn('Session parsing error:', e);
        }
      }
    }

    if (!resolvedEmail) {
      resolvedEmail = 'hrd@perusahaan.co.id';
    }

    if (!resolvedToken) {
      const tokenObj = createInvitationToken(resolvedEmail, resolvedPkg);
      addInvitationToken(tokenObj);
      resolvedToken = tokenObj.token;
    }

    // Check if token was already consumed
    const existingTok = findInvitationToken(resolvedToken);
    if (existingTok && existingTok.isUsed) {
      setIsTokenConsumed(true);
    } else {
      fetch('/api/company/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resolvedToken })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.valid && data.reason?.includes('sudah pernah digunakan')) {
            setIsTokenConsumed(true);
          }
        })
        .catch(() => {});
    }

    setOrderId(paramOrderId);
    setEmail(resolvedEmail);
    setPackageName(resolvedPkg);
    setPriceFormatted(resolvedPrice);
    setActivationUrl(`/auth/company-register?token=${resolvedToken}&email=${encodeURIComponent(resolvedEmail)}`);
  }, [searchParams]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-10 text-center space-y-7 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Big Green Circular Checkmark */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50 relative z-10">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>

        {/* Heading */}
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pembayaran Berhasil! 🎉
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Terima kasih! Pembayaran untuk <strong className="text-white">Paket {packageName}</strong> telah kami terima.
          </p>
        </div>

        {/* Box Detail Ringkasan Pesanan */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 text-xs space-y-3 text-left relative z-10 shadow-inner">
          <div className="flex justify-between items-center text-slate-400">
            <span>ID Pesanan</span>
            <span className="font-mono font-bold text-slate-200">{orderId}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Paket</span>
            <span className="font-bold text-white">{packageName}</span>
          </div>
          <div className="pt-2.5 border-t border-slate-800/80 flex justify-between items-center text-slate-300">
            <span className="font-semibold">Total Dibayar</span>
            <span className="text-base font-black text-emerald-400">{priceFormatted}</span>
          </div>
        </div>

        {/* Box Cek Kotak Masuk Email Anda */}
        <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-left text-xs space-y-3 relative z-10">
          <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
            <Mail className="w-5 h-5" />
            <span>Cek Kotak Masuk Email Anda</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Kami telah mengirimkan <strong>link pembuatan akun</strong> ke email:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 font-bold text-center tracking-wide text-xs sm:text-sm shadow-sm">
            {email}
          </div>
          <p className="text-slate-400 text-[10px] sm:text-[11px] leading-relaxed pt-1">
            Klik link tersebut untuk membuat akun Perusahaan Anda. Link pendaftaran ini adalah <strong>One-Time Link</strong> yang hanya dapat digunakan 1 kali untuk membuat akun.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 relative z-10">
          {isTokenConsumed ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Akun Perusahaan Telah Berhasil Dibuat & Aktif</span>
              </div>
              <Link
                href="/company"
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.01]"
              >
                <Building2 className="w-4 h-4" />
                <span>Buka Portal Dashboard Perusahaan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <Link
              href={activationUrl}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.01]"
            >
              <span>Aktivasi & Buat Akun Perusahaan Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/"
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700/60"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
