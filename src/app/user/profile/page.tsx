'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, UserBiodata, SocialMediaItem, DocumentAttachment } from '@/lib/types';
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
  Share2,
  Calendar,
  MapPin,
  Building,
  CheckCircle2,
  ArrowRight,
  Globe,
  Loader2,
  Save,
  Plus,
  Trash2,
  Link as LinkIcon,
  Check,
  Sparkles,
  Info,
  Camera,
  Upload,
  Image as ImageIcon,
  Phone,
  FileText
} from 'lucide-react';

const PRESET_PLATFORMS = [
  { name: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { name: 'GitHub', placeholder: 'https://github.com/username' },
  { name: 'Instagram', placeholder: '@username atau https://instagram.com/username' },
  { name: 'TikTok', placeholder: '@username atau https://tiktok.com/@username' },
  { name: 'Facebook', placeholder: 'https://facebook.com/username' },
  { name: 'Twitter (X)', placeholder: '@username atau https://x.com/username' },
  { name: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { name: 'Portofolio / Website', placeholder: 'https://portofolio-anda.com' }
];

const ALL_PLATFORMS = [
  'LinkedIn',
  'GitHub',
  'Instagram',
  'TikTok',
  'Facebook',
  'Twitter (X)',
  'YouTube',
  'Threads',
  'Portofolio / Website',
  'Behance / Dribbble',
  'Medium / Dev.to',
  'Lainnya'
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Photo State
  const [avatarUrl, setAvatarUrl] = useState('');

  // Form State - Biodata
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan' | ''>('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Education
  const [lastEducation, setLastEducation] = useState('S1');
  const [educationMajor, setEducationMajor] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [gpa, setGpa] = useState('');

  // Dynamic Social Media Accounts List
  const [socialItems, setSocialItems] = useState<SocialMediaItem[]>([
    { id: '1', platform: 'LinkedIn', urlOrUsername: '' },
    { id: '2', platform: 'GitHub', urlOrUsername: '' },
    { id: '3', platform: 'Instagram', urlOrUsername: '' }
  ]);
  const [additionalBio, setAdditionalBio] = useState('');

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
    setAdditionalBio(user.biodata?.socials?.additionalBio || '');

    const initialDocs = user.biodata?.documents || [];
    setDocuments(initialDocs);

    // Reconstruct socialItems from saved profile
    if (user.biodata?.socials) {
      const savedSocials = user.biodata.socials;
      if (savedSocials.customLinks && savedSocials.customLinks.length > 0) {
        setSocialItems(savedSocials.customLinks);
      } else {
        const loaded: SocialMediaItem[] = [];
        if (savedSocials.linkedin) loaded.push({ id: 'li', platform: 'LinkedIn', urlOrUsername: savedSocials.linkedin });
        if (savedSocials.github) loaded.push({ id: 'gh', platform: 'GitHub', urlOrUsername: savedSocials.github });
        if (savedSocials.instagram) loaded.push({ id: 'ig', platform: 'Instagram', urlOrUsername: savedSocials.instagram });
        if (savedSocials.tiktok) loaded.push({ id: 'tt', platform: 'TikTok', urlOrUsername: savedSocials.tiktok });
        if (savedSocials.facebook) loaded.push({ id: 'fb', platform: 'Facebook', urlOrUsername: savedSocials.facebook });
        if (savedSocials.twitter) loaded.push({ id: 'tw', platform: 'Twitter (X)', urlOrUsername: savedSocials.twitter });
        if (savedSocials.portfolioUrl) loaded.push({ id: 'pf', platform: 'Portofolio / Website', urlOrUsername: savedSocials.portfolioUrl });

        if (loaded.length > 0) {
          setSocialItems(loaded);
        }
      }
    }
  }, []);

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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetAvatar = () => {
    const neutral = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || currentUser?.name || 'User')}&backgroundColor=059669,047857,0f172a&textColor=ffffff`;
    setAvatarUrl(neutral);
  };

  const handleAddPlatformPreset = (platformName: string) => {
    setSocialItems([
      ...socialItems,
      { id: `soc-${Date.now()}-${Math.random()}`, platform: platformName, urlOrUsername: '' }
    ]);
  };

  const handleAddBlankSocialItem = () => {
    setSocialItems([
      ...socialItems,
      { id: `soc-${Date.now()}-${Math.random()}`, platform: 'LinkedIn', urlOrUsername: '' }
    ]);
  };

  const handleRemoveSocialItem = (index: number) => {
    const updated = [...socialItems];
    updated.splice(index, 1);
    setSocialItems(updated);
  };

  const handleSocialChange = (index: number, field: 'platform' | 'urlOrUsername', value: string) => {
    const updated = [...socialItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setSocialItems(updated);
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
      // Map dynamic items
      const activeSocials = socialItems.filter((s) => s.urlOrUsername.trim().length > 0);
      const linkedinObj = activeSocials.find((s) => s.platform === 'LinkedIn');
      const githubObj = activeSocials.find((s) => s.platform === 'GitHub');
      const instagramObj = activeSocials.find((s) => s.platform === 'Instagram');
      const tiktokObj = activeSocials.find((s) => s.platform === 'TikTok');
      const facebookObj = activeSocials.find((s) => s.platform === 'Facebook');
      const twitterObj = activeSocials.find((s) => s.platform.includes('Twitter'));
      const portfolioObj = activeSocials.find((s) => s.platform.includes('Portofolio') || s.platform.includes('Website'));

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
        socials: {
          linkedin: linkedinObj?.urlOrUsername.trim(),
          github: githubObj?.urlOrUsername.trim(),
          instagram: instagramObj?.urlOrUsername.trim(),
          tiktok: tiktokObj?.urlOrUsername.trim(),
          facebook: facebookObj?.urlOrUsername.trim(),
          twitter: twitterObj?.urlOrUsername.trim(),
          portfolioUrl: portfolioObj?.urlOrUsername.trim(),
          customLinks: activeSocials,
          additionalBio: additionalBio.trim()
        },
        documents,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };

      // Background AI screener evaluates data silently for HR
      const aiReport = await analyzeCandidateBackgroundViaServer(rawBiodata);
      rawBiodata.aiBackgroundReport = aiReport;

      updateUserBiodata(currentUser.id, rawBiodata, avatarUrl);
      setIsSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // If there's a callbackUrl (e.g. from job detail), redirect back after short moment
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
  const isStep3Done = socialItems.some(s => s.urlOrUsername.trim().length > 0) || Boolean(additionalBio.trim().length > 0);

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
              Lengkapi data diri, riwayat pendidikan, serta tautan media sosial dan portofolio Anda untuk mempermudah tim HRD perusahaan memverifikasi profil saat melamar pekerjaan.
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

        {/* Step Progression Pills (Dynamic) */}
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
            <span className="hidden sm:inline">Media Sosial & Web</span>
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
                Data profil Anda telah tersimpan dan siap digunakan untuk melamar di seluruh lowongan kerja mitra.
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

        {/* SECTION 1: DATA PRIBADI & BIODATA */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Data Pribadi & Biodata Diri</h2>
              <p className="text-[11px] text-slate-400">Identitas resmi untuk verifikasi administratif rekrutmen.</p>
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
                placeholder="Contoh: Riko Rizky"
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

            {/* Nama Lengkap field is above, then gender selector below */}

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
                    ? 'Contoh: IPA / IPS / Rekayasa Perangkat Lunak (Opsional)'
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

        {/* SECTION 3: DYNAMIC SOCIAL MEDIA & LINKS */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Tautan Media Sosial & Portofolio</h2>
                <p className="text-[11px] text-slate-400">
                  Cantumkan akun media sosial seperti LinkedIn, GitHub, Instagram, TikTok, Facebook, YouTube, atau Portofolio Anda.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddBlankSocialItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 shrink-0 self-start sm:self-auto hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Baru</span>
            </button>
          </div>

          {/* Quick Preset Buttons (1-Click Add Platform) */}
          <div className="space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold block">
              Pintasan Tambah Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PLATFORMS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPlatformPreset(preset.name)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-medium transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Social Items List - Clean 1-Line Format */}
          <div className="space-y-3 pt-2">
            {socialItems.map((item, index) => (
              <div key={item.id || index} className="flex items-center gap-2.5">
                {/* Platform Selector */}
                <select
                  value={item.platform}
                  onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                  className="w-36 sm:w-44 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-semibold text-xs focus:outline-none focus:border-emerald-500 shrink-0"
                >
                  {ALL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {/* Input Link / Username */}
                <input
                  type="text"
                  placeholder={`Link atau username ${item.platform}...`}
                  value={item.urlOrUsername}
                  onChange={(e) => handleSocialChange(index, 'urlOrUsername', e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 font-mono"
                />

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveSocialItem(index)}
                  className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                  title="Hapus baris ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {socialItems.length === 0 && (
              <div className="p-6 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <Share2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-xs">Belum ada media sosial yang ditambahkan.</p>
                <button
                  type="button"
                  onClick={handleAddBlankSocialItem}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-semibold border border-slate-800"
                >
                  + Tambah Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Extra Bio Textarea */}
          <div className="space-y-1.5 pt-4 border-t border-slate-800/80">
            <label className="font-semibold text-slate-300">
              Deskripsi Singkat / Ringkasan Portofolio (Opsional):
            </label>
            <textarea
              rows={3}
              placeholder="Ceritakan secara singkat mengenai minat karir, fokus keahlian, atau proyek yang pernah Anda kerjakan..."
              value={additionalBio}
              onChange={(e) => setAdditionalBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 leading-relaxed text-xs"
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: UNGGAH BERKAS KARIR (CV, SURAT LAMARAN, & SERTIFIKAT) */}
        {/* ========================================================================= */}
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
                  Unggah CV, Surat Lamaran, dan Sertifikat Anda. Berkas ini digunakan oleh sistem AI untuk menghitung skor kecocokan Anda dengan lowongan kerja mitra.
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
            onDocumentsChange={(updatedDocs) => setDocuments(updatedDocs)}
          />

          {/* Banner link to Dedicated AI Recommendations Page */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Ingin Melihat Daftar Perusahaan yang Cocok dengan CV Anda?
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Buka halaman khusus Rekomendasi AI untuk melihat persentase kecocokan dan langsung mengirimkan lamaran dalam 1 klik.
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
            <span className="font-semibold">Sedang menyimpan dan memverifikasi data profil Anda...</span>
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
