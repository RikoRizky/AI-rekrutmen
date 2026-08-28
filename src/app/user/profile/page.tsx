'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, UserBiodata, DocumentAttachment } from '@/lib/types';
import {
  getCurrentUser,
  updateUserBiodata,
  initializeStorage,
  getDefaultUserAvatar
} from '@/lib/storage';
import { analyzeCandidateBackgroundViaServer } from '@/lib/ai-background-evaluator-client';
import DocumentUploader from '@/components/DocumentUploader';
import Link from 'next/link';
import {
  User as UserIcon,
  GraduationCap,
  Calendar,
  MapPin,
  Building,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Save,
  Sparkles,
  Camera,
  Upload,
  Phone,
  FileText,
  Briefcase
} from 'lucide-react';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Photo State
  const [avatarUrl, setAvatarUrl] = useState('');

  // Form State - Data Pribadi
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan' | ''>('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Form State - Pendidikan
  const [lastEducation, setLastEducation] = useState('S1');
  const [educationMajor, setEducationMajor] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [gpa, setGpa] = useState('');

  // Form State - Deskripsi Profil / Bio
  const [bioSummary, setBioSummary] = useState('');

  // Documents State (CV, Surat Lamaran, Sertifikat)
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);

  // Processing state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    initializeStorage();
    const user = getCurrentUser();
    if (!user) {
      router.push('/auth?callbackUrl=/user/profile');
      return;
    }
    setCurrentUser(user);

    // Initial avatar logic
    const defaultNeutral = getDefaultUserAvatar(user.name || 'User');
    if (user.avatar && !user.avatar.includes('avataaars') && !user.avatar.includes('api.dicebear.com')) {
      setAvatarUrl(user.avatar);
    } else {
      setAvatarUrl(defaultNeutral);
    }

    // Populate existing values if available
    setFullName(user.biodata?.fullName || user.name || '');
    setGender((user.biodata?.gender as 'Laki-laki' | 'Perempuan' | '') || '');
    setPhone(user.biodata?.phone || user.phone || '');
    setBirthDate(user.biodata?.birthDate || '');
    setBirthPlace(user.biodata?.birthPlace || '');
    setAddress(user.biodata?.address || '');
    setCity(user.biodata?.city || '');

    setLastEducation(user.biodata?.lastEducation || 'S1');
    setEducationMajor(user.biodata?.educationMajor || '');
    setInstitutionName(user.biodata?.institutionName || '');
    setGraduationYear(user.biodata?.graduationYear || '');
    setGpa(user.biodata?.gpa || '');
    setBioSummary(user.biodata?.bioSummary || user.biodata?.socials?.additionalBio || '');

    const initialDocs = user.biodata?.documents || [];
    setDocuments(initialDocs);
  }, [router]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran berkas foto profil maksimal 2MB.');
        return;
      }
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        if (currentUser) {
          const updated = { ...currentUser, avatar: base64 };
          setCurrentUser(updated);
          localStorage.setItem('smartrecruit_current_user', JSON.stringify(updated));
          window.dispatchEvent(new Event('smartrecruit_data_refreshed'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentsChange = (updatedDocs: DocumentAttachment[]) => {
    setDocuments(updatedDocs);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);

    const isHighSchool = lastEducation.includes('SMA') || lastEducation.includes('SMK') || lastEducation === 'Lainnya';

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!institutionName.trim()) {
      setErrorMsg(isHighSchool ? 'Nama Sekolah wajib diisi.' : 'Nama Universitas / Perguruan Tinggi wajib diisi.');
      return;
    }
    if (!isHighSchool && !educationMajor.trim()) {
      setErrorMsg('Jurusan / Program Studi wajib diisi untuk jenjang pendidikan tinggi.');
      return;
    }

    const finalMajor = isHighSchool ? (educationMajor.trim() || 'Umum / IPA / IPS') : educationMajor.trim();

    setIsSaving(true);

    try {
      const rawBiodata: UserBiodata = {
        fullName: fullName.trim(),
        gender: gender || undefined,
        phone: phone.trim(),
        birthDate: birthDate.trim(),
        birthPlace: birthPlace.trim(),
        address: address.trim(),
        city: city.trim(),
        lastEducation,
        educationMajor: finalMajor,
        institutionName: institutionName.trim(),
        graduationYear: graduationYear.trim(),
        gpa: gpa.trim(),
        bioSummary: bioSummary.trim(),
        socials: {
          additionalBio: bioSummary.trim()
        },
        documents,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };

      // Background AI evaluator performs candidate background check purely from biodata
      const aiReport = await analyzeCandidateBackgroundViaServer(rawBiodata);
      rawBiodata.aiBackgroundReport = aiReport;

      updateUserBiodata(currentUser.id, rawBiodata, avatarUrl);
      setIsSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (callbackUrl) {
        setTimeout(() => {
          router.push(callbackUrl);
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving biodata:', err);
      setErrorMsg('Terjadi kesalahan saat menyimpan data. Silakan coba kembali.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dynamic progress calculation based on filled fields
  const isStep1Done = Boolean(fullName.trim().length > 0 && (birthPlace.trim() || birthDate.trim() || city.trim() || address.trim()));
  const isStep2Done = Boolean(institutionName.trim().length > 0 && educationMajor.trim().length > 0);
  const isStep3Done = Boolean(bioSummary.trim().length > 0 || documents.length > 0);

  const completedStepsCount = (isStep1Done ? 1 : 0) + (isStep2Done ? 1 : 0) + (isStep3Done ? 1 : 0);

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Profil Pencari Kerja</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Kelengkapan Biodata & Profil
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-1">
              Lengkapi data diri resmi, riwayat pendidikan, dan berkas karir Anda. Sistem AI akan mengevaluasi rekam jejak dan kualifikasi Anda secara murni dari informasi biodata yang Anda isi.
            </p>
          </div>

          <div className={`flex items-center gap-2 bg-slate-950/70 border p-3 rounded-2xl shrink-0 text-xs transition-colors ${
            completedStepsCount === 3 
              ? 'border-emerald-500/40 bg-emerald-950/20' 
              : completedStepsCount > 0 
                ? 'border-amber-500/40 bg-amber-950/20' 
                : 'border-slate-800'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              completedStepsCount === 3
                ? 'bg-emerald-500/20 text-emerald-400'
                : completedStepsCount > 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800 text-slate-400'
            }`}>
              {completedStepsCount}/3
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-xs">Tahapan Profil</p>
              <p className={`text-[11px] font-semibold ${
                completedStepsCount === 3
                  ? 'text-emerald-400'
                  : completedStepsCount > 0
                    ? 'text-amber-400'
                    : 'text-slate-400'
              }`}>
                {completedStepsCount === 3 
                  ? 'Lengkap & Siap Lamar' 
                  : completedStepsCount === 2 
                    ? '2 Tahap Selesai' 
                    : completedStepsCount === 1 
                      ? '1 Tahap Selesai' 
                      : 'Belum Dilengkapi'}
              </p>
            </div>
          </div>
        </div>

        {/* Step Progression Pills */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] font-semibold">
          <div className={`flex items-center gap-2 ${isStep1Done ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isStep1Done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
            }`}>
              {isStep1Done ? '✓' : '1'}
            </span>
            <span className="hidden sm:inline">Data Pribadi</span>
          </div>

          <div className={`flex items-center gap-2 ${isStep2Done ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isStep2Done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
            }`}>
              {isStep2Done ? '✓' : '2'}
            </span>
            <span className="hidden sm:inline">Pendidikan Terakhir</span>
          </div>

          <div className={`flex items-center gap-2 ${isStep3Done ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isStep3Done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
            }`}>
              {isStep3Done ? '✓' : '3'}
            </span>
            <span className="hidden sm:inline">Ringkasan & Berkas Karir</span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {isSaved && (
        <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Profil & Biodata Anda Berhasil Disimpan!</h3>
              <p className="text-slate-300 text-xs mt-0.5">
                Data profil resmi Anda telah tersimpan dan siap digunakan untuk melamar di seluruh lowongan kerja mitra.
              </p>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            {callbackUrl ? (
              <Link
                href={callbackUrl}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Kembali Melamar Lowongan Kerja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/jobs"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Eksplorasi Lowongan Kerja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              href="/user/applications"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Lihat Lamaran Saya
            </Link>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8 text-xs">

        {/* SECTION 1: DATA PRIBADI & BIODATA RESMI */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Data Pribadi & Identitas Resmi (KTP)</h2>
              <p className="text-[11px] text-slate-400">Identitas resmi untuk verifikasi administratif rekrutmen dan audit rekam jejak.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Photo Profile Uploader */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || getDefaultUserAvatar(fullName || currentUser?.name || 'User')}
                  alt="Foto Profil"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg bg-slate-900"
                />
                <label
                  htmlFor="avatar-file-input"
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity"
                  title="Ganti Foto Profil"
                >
                  <Camera className="w-5 h-5 mb-0.5 text-emerald-400" />
                  <span>Ganti</span>
                </label>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div>
                  <h3 className="font-bold text-white text-xs">Foto Profil Pelamar</h3>
                  <p className="text-[11px] text-slate-400">
                    Gunakan foto formal/semi-formal. Format JPG, PNG, atau WEBP (Maksimal 2MB).
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label
                    htmlFor="avatar-file-input"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unggah Foto Profil</span>
                  </label>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const def = getDefaultUserAvatar(fullName || currentUser?.name || 'User');
                        setAvatarUrl(def);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] font-medium transition-colors"
                    >
                      Gunakan Foto Default Pelamar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Nama Lengkap Sesuai KTP: *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Riko Rizky Baswara"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">No. WhatsApp / Nomor Telepon: *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">Nomor ini akan otomatis terisi saat Anda mengirim lamaran ke lowongan kerja.</p>
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Jenis Kelamin: *</label>
              <div className="flex gap-3">
                {(['Laki-laki', 'Perempuan'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 px-4 rounded-xl border font-semibold text-sm transition-all ${
                      gender === g
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {g === 'Laki-laki' ? '♂ Laki-laki' : '♀ Perempuan'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Tempat Lahir:</label>
              <input
                type="text"
                placeholder="Contoh: Jakarta"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Tanggal Lahir:</label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Alamat Tempat Tinggal (Domisili):</label>
              <input
                type="text"
                placeholder="Contoh: Jl. Tebet Barat Dalam No. 42"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Kota / Kabupaten Domisili:</label>
              <input
                type="text"
                placeholder="Contoh: Jakarta Selatan"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* SECTION 2: PENDIDIKAN TERAKHIR */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Riwayat Pendidikan Terakhir</h2>
              <p className="text-[11px] text-slate-400">
                {lastEducation.includes('SMA') || lastEducation.includes('SMK')
                  ? 'Informasi asal sekolah SMA / SMK / sederajat Anda.'
                  : 'Latar belakang akademik dan institusi perguruan tinggi resmi Anda.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Jenjang Pendidikan: *</label>
              <select
                value={lastEducation}
                onChange={(e) => setLastEducation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="SMA / SMK / Sederajat">SMA / SMK / Sederajat</option>
                <option value="D3">Diploma 3 (D3)</option>
                <option value="D4 / S1">Sarjana (D4 / S1)</option>
                <option value="S2">Magister / Master (S2)</option>
                <option value="S3">Doktor (S3)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                {lastEducation.includes('SMA') || lastEducation.includes('SMK')
                  ? 'Nama Sekolah (SMA / SMK / MA): *'
                  : 'Nama Universitas / Perguruan Tinggi: *'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  lastEducation.includes('SMA') || lastEducation.includes('SMK')
                    ? 'Contoh: SMAN 1 Bandung atau SMKN 2 Jakarta'
                    : 'Contoh: Institut Teknologi Bandung (ITB)'
                }
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                {lastEducation.includes('SMA') || lastEducation.includes('SMK')
                  ? 'Jurusan / Peminatan (Opsional):'
                  : 'Jurusan / Program Studi: *'}
              </label>
              <input
                type="text"
                required={!lastEducation.includes('SMA') && !lastEducation.includes('SMK') && lastEducation !== 'Lainnya'}
                placeholder={
                  lastEducation.includes('SMA') || lastEducation.includes('SMK')
                    ? 'Contoh: IPA / IPS / Rekayasa Perangkat Lunak'
                    : 'Contoh: Teknik Informatika'
                }
                value={educationMajor}
                onChange={(e) => setEducationMajor(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Tahun Kelulusan:</label>
              <input
                type="text"
                placeholder="Contoh: 2024"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">
                {lastEducation.includes('SMA') || lastEducation.includes('SMK')
                  ? 'Nilai Rata-rata Ujian / Nilai Rapor (Opsional):'
                  : 'Indeks Prestasi Kumulatif (IPK, Skala 4.0 - Opsional):'}
              </label>
              <input
                type="text"
                placeholder={
                  lastEducation.includes('SMA') || lastEducation.includes('SMK')
                    ? 'Contoh: 88.5 atau 90'
                    : 'Contoh: 3.82'
                }
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        {/* SECTION 3: RINGKASAN PROFIL & DESKRIPSI KARIR */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ringkasan Profil & Deskripsi Karir (Bio Diri)</h2>
              <p className="text-[11px] text-slate-400">
                Jelaskan fokus keahlian, minat karir, atau pencapaian profesional Anda untuk dianalisis oleh AI.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">
              Deskripsi Singkat / Ringkasan Pengalaman Profesional:
            </label>
            <textarea
              rows={4}
              placeholder="Ceritakan secara singkat mengenai minat karir, keahlian utama, pengalaman relevan, atau spesialisasi industri yang Anda kuasai..."
              value={bioSummary}
              onChange={(e) => setBioSummary(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 leading-relaxed text-xs placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-500">
              Informasi ini akan diintegrasikan bersama riwayat pendidikan untuk menyusun laporan rekam jejak bagi tim HRD perusahaan.
            </p>
          </div>
        </div>

        {/* SECTION 4: UNGGAH BERKAS KARIR (CV, SURAT LAMARAN, & SERTIFIKAT) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                4
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Berkas Karir & Dokumen Pelamar</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                    AI ATS Parser
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Unggah CV, Surat Lamaran, dan Sertifikat Anda. Berkas ini digunakan oleh sistem AI untuk cross-check identitas resmi serta menghitung skor kecocokan loker.
                </p>
              </div>
            </div>

            <Link
              href="/user/recommendations"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 shrink-0 self-start sm:self-auto hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lihat Rekomendasi Loker &rarr;</span>
            </Link>
          </div>

          {/* Document Uploader Component */}
          <DocumentUploader
            documents={documents}
            onDocumentsChange={handleDocumentsChange}
          />

          {/* Banner link to Dedicated AI Recommendations Page */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Ingin Melihat Daftar Perusahaan yang Cocok dengan Profil Anda?
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Buka halaman khusus Rekomendasi AI untuk melihat persentase kecocokan dan langsung melamar dalam 1 klik.
                </p>
              </div>
            </div>

            <Link
              href="/user/recommendations"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5 shrink-0 hover:scale-105"
            >
              <span>Buka Rekomendasi AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Processing Indicator */}
        {isSaving && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 space-y-2 text-xs flex items-center gap-3 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            <span className="font-semibold">Sedang mengevaluasi rekam jejak biodata dengan AI dan menyimpan data...</span>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2 pb-12">
          {callbackUrl ? (
            <Link
              href={callbackUrl}
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              &larr; Kembali ke Loker
            </Link>
          ) : (
            <Link
              href="/jobs"
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              Lihat Semua Loker &rarr;
            </Link>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-950/50 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105"
          >
            {isSaving ? (
              <span>Menyimpan Profil...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Biodata & Berkas</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}

export default function ApplicantProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-xs text-slate-400">Memuat profil...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

