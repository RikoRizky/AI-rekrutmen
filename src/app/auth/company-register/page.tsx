'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { findInvitationToken, consumeInvitationToken, registerNewCompany, initializeStorage } from '@/lib/storage';
import { isTokenValid } from '@/lib/token';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  User,
  Globe,
  MapPin,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';

function CompanyRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenStr = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Teknologi Informasi');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState(emailParam);
  const [adminPhone, setAdminPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initializeStorage();
    if (!tokenStr) {
      setTokenError('Token pendaftaran tidak ditemukan. Pastikan Anda membuka link dari email konfirmasi Midtrans.');
      setIsValidating(false);
      return;
    }

    // Check token in storage / simulation
    const foundToken = findInvitationToken(tokenStr);
    if (!foundToken) {
      // If token not yet saved in localStorage (e.g. direct url with cptk_), allow valid format for demo
      if (tokenStr.startsWith('cptk_')) {
        setTokenData({
          token: tokenStr,
          email: emailParam || 'admin@perusahaan.com',
          packageType: 'Professional HR ATS',
          isUsed: false,
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        });
        if (emailParam) setAdminEmail(emailParam);
        setIsValidating(false);
        return;
      }

      setTokenError('Token tidak valid atau tidak terdaftar di sistem.');
      setIsValidating(false);
      return;
    }

    const validity = isTokenValid(foundToken);
    if (!validity.valid) {
      setTokenError(validity.reason || 'Token tidak valid.');
      setIsValidating(false);
      return;
    }

    setTokenData(foundToken);
    if (foundToken.email) setAdminEmail(foundToken.email);
    setIsValidating(false);
  }, [tokenStr, emailParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim()) {
      alert('Harap isi semua data bertanda bintang.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Consume token so it cannot be used again
      consumeInvitationToken(tokenStr);

      // Register company & company admin user
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { company, user } = registerNewCompany(
        {
          name: companyName,
          slug,
          industry,
          website,
          address,
          description,
          activeSubscription: tokenData?.packageType || 'Professional',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          jobQuota: 20,
          logo: `https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&auto=format&fit=crop&q=60`
        },
        {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password
        }
      );

      // Redirect directly to company portal
      router.push('/company');
    } catch (err) {
      console.error('Registration error:', err);
      alert('Gagal menyelesaikan registrasi perusahaan.');
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs">Memverifikasi keaslian One-Time Token pendaftaran...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Akses Link Tidak Valid</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{tokenError}</p>
        <div className="pt-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            <span>Kembali ke Halaman Paket</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 space-y-8">
      
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Token Valid: {tokenData?.packageType || 'Paket Langganan'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Aktivasi & Setup Akun Perusahaan
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Lengkapi identitas profil perusahaan Anda untuk mulai memasang lowongan kerja dan menggunakan analisis berkas otomatis AI.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 text-xs shadow-2xl">
        
        {/* Section 1: Profil PT */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Informasi Perusahaan (PT/CV/Instansi)</span>
          </h3>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Nama Resmi Perusahaan: *</label>
            <input
              type="text"
              required
              placeholder="Contoh: PT Astra Inovasi Digital"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Industri / Sektor:</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Teknologi Informasi">Teknologi Informasi & Software</option>
                <option value="Perbankan & Fintech">Perbankan & Fintech</option>
                <option value="Manufaktur & Otomotif">Manufaktur & Otomotif</option>
                <option value="Telekomunikasi">Telekomunikasi & Jaringan</option>
                <option value="Kesehatan & Farmasi">Kesehatan & Farmasi</option>
                <option value="Pendidikan">Pendidikan & Edutech</option>
                <option value="Logistik & Supply Chain">Logistik & Supply Chain</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Website Perusahaan:</label>
              <input
                type="url"
                placeholder="https://perusahaan.co.id"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Alamat Kantor:</label>
            <input
              type="text"
              placeholder="Gedung, Jalan, Kota, Provinsi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Tentang / Deskripsi Singkat Perusahaan:</label>
            <textarea
              rows={3}
              placeholder="Ceritakan tentang visi, produk utama, dan kultur perusahaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Section 2: Akun Admin PT */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Kredensial Admin Perekrut (HRD / PIC)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nama Lengkap PIC: *</label>
              <input
                type="text"
                required
                placeholder="Sarah Wijaya"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Email Akun Admin: *</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">No. Kontak WhatsApp:</label>
              <input
                type="tel"
                placeholder="0812xxxxxxxx"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Buat Password: *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat Akun & Profil PT...</span>
              </>
            ) : (
              <>
                <span>Selesaikan Pendaftaran & Masuk Portal PT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}

export default function CompanyRegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat formulir pendaftaran...</div>}>
      <CompanyRegisterContent />
    </Suspense>
  );
}
