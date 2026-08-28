import { User, Company, Job, Application, SubscriptionPackage, Transaction, CompanyInvitationToken, AppSettings } from './types';

export const SEED_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'PT Astra Digital Nusantara',
    slug: 'astra-digital-nusantara',
    logo: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=120&auto=format&fit=crop&q=80',
    description: 'Divisi inovasi digital terdepan dari grup konglomerasi otomotif dan teknologi terbesar di Indonesia.',
    industry: 'Manufaktur, Otomotif & Teknologi',
    website: 'https://astradigital.co.id',
    address: 'Menara Astra Lt. 35, Jl. Jend. Sudirman Kav. 5-6, Jakarta Pusat',
    isVerified: true,
    activeSubscription: 'Industri',
    subscriptionExpiresAt: '2026-12-31T23:59:59Z',
    jobQuota: 999,
    createdAt: '2025-01-10T08:00:00Z'
  },
  {
    id: 'comp-2',
    name: 'PT Mandiri Fintech Solusindo',
    slug: 'mandiri-fintech-solusindo',
    logo: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=120&auto=format&fit=crop&q=80',
    description: 'Perusahaan teknologi finansial penyedia infrastruktur pembayaran digital dan perbankan modern.',
    industry: 'Perbankan & Fintech',
    website: 'https://mandirifintech.id',
    address: 'Plaza Mandiri, Jl. Gatot Subroto Kav. 36-38, Jakarta Selatan',
    isVerified: true,
    activeSubscription: 'Perusahaan',
    subscriptionExpiresAt: '2026-11-15T23:59:59Z',
    jobQuota: 20,
    createdAt: '2025-02-01T09:00:00Z'
  },
  {
    id: 'comp-3',
    name: 'PT Telkom Digital Inovasi',
    slug: 'telkom-digital-inovasi',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
    description: 'Pusat pengembangan produk kecerdasan buatan, cloud computing, dan infrastruktur data nasional.',
    industry: 'Telekomunikasi & AI',
    website: 'https://telkomdigital.co.id',
    address: 'Telkom Landmark Tower, Jl. Gatot Subroto, Jakarta Selatan',
    isVerified: true,
    activeSubscription: 'Industri',
    subscriptionExpiresAt: '2026-09-30T23:59:59Z',
    jobQuota: 999,
    createdAt: '2025-02-15T10:00:00Z'
  },
  {
    id: 'comp-4',
    name: 'Kopi Craft Nusantara (UMK)',
    slug: 'kopi-craft-nusantara',
    logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=120&auto=format&fit=crop&q=80',
    description: 'Jaringan usaha mikro-kecil kedai kopi artisan lokal yang memberdayakan petani kopi nusantara dan talenta muda.',
    industry: 'Kuliner & F&B (UMK)',
    website: 'https://kopicraft.id',
    address: 'Jl. Senopati No. 28, Kebayoran Baru, Jakarta Selatan',
    isVerified: true,
    activeSubscription: 'UMK',
    subscriptionExpiresAt: '2026-08-31T23:59:59Z',
    jobQuota: 5,
    createdAt: '2025-02-16T10:00:00Z'
  },
  {
    id: 'comp-5',
    name: 'Studio Desain Lumina (UMK)',
    slug: 'studio-desain-lumina',
    logo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=120&auto=format&fit=crop&q=80',
    description: 'Creative studio dan agensi desain grafis skala kecil yang berfokus pada identitas visual brand lokal.',
    industry: 'Kreatif & Desain (UMK)',
    website: 'https://lumina-studio.co',
    address: 'Jl. Riau No. 54, Bandung, Jawa Barat',
    isVerified: true,
    activeSubscription: 'UMK',
    subscriptionExpiresAt: '2026-10-31T23:59:59Z',
    jobQuota: 5,
    createdAt: '2025-02-17T11:00:00Z'
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'user-superadmin',
    name: 'Riko Rizky (Super Admin)',
    email: 'admin@smartrecruit.id',
    phone: '081299887766',
    role: 'super_admin',
    headline: 'Platform Owner & Super Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'user-hr-astra',
    name: 'Sarah Wijaya, M.Psi',
    email: 'sarah.wijaya@astradigital.co.id',
    phone: '081344556677',
    role: 'company_admin',
    companyId: 'comp-1',
    companyName: 'PT Astra Digital Nusantara',
    headline: 'Talent Acquisition & People Lead at Astra Digital',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-01-12T10:00:00Z'
  },
  {
    id: 'user-hr-mandiri',
    name: 'Hendro Prasetyo',
    email: 'talent@mandirifintech.id',
    phone: '081122334455',
    role: 'company_admin',
    companyId: 'comp-2',
    companyName: 'PT Mandiri Fintech Solusindo',
    headline: 'Head of Human Capital at Mandiri Fintech',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-02-05T11:00:00Z'
  },
  {
    id: 'user-budi',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    phone: '081234567890',
    role: 'applicant',
    headline: 'Senior Fullstack TypeScript & Cloud Engineer (5+ Thn Exp)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    profileCompleted: true,
    biodata: {
      fullName: 'Budi Santoso',
      birthDate: '1996-05-14',
      birthPlace: 'Jakarta',
      address: 'Jl. Tebet Barat Dalam No. 42',
      city: 'Jakarta Selatan',
      lastEducation: 'S1',
      educationMajor: 'Teknik Informatika',
      institutionName: 'Institut Teknologi Bandung (ITB)',
      graduationYear: '2019',
      gpa: '3.82',
      bioSummary: 'Senior Fullstack Engineer yang berdedikasi membangun aplikasi SaaS berskala besar dan arsitektur cloud terdistribusi.',
      profileCompleted: true,
      aiBackgroundReport: {
        personalitySummary: 'Budi Santoso menunjukkan integritas profesional yang tinggi, etos kerja kolaboratif, dan komunikasi yang matang serta berorientasi pada pemecahan masalah teknis.',
        credibilityScore: 96,
        digitalFootprintScore: 96,
        careerTrajectorySummary: 'Rekam jejak karir solid dengan pengalaman engineering intensif pasca-kelulusan S1 ITB tahun 2019, linier dengan spesialisasi arsitektur cloud dan web development skala besar.',
        socialMediaPresenceSummary: 'Rekam jejak karir solid dengan pengalaman engineering intensif pasca-kelulusan S1 ITB tahun 2019.',
        academicAuditSummary: 'Lulusan S1 Teknik Informatika ITB dengan IPK 3.82 (Cumlaude), timeline akademik konsisten.',
        calculatedAge: 29,
        integrityAndEthicsScore: 98,
        greenFlags: [
          'Latar belakang pendidikan resmi terakreditasi Unggul (ITB) dengan IPK 3.82',
          'Nama resmi di KTP terverifikasi konsisten dengan seluruh berkas CV',
          'Timeline kronologi kelulusan dan durasi karir sangat linier dan terstruktur'
        ],
        redFlags: [
          'Biodata resmi dan berkas pendukung lengkap tanpa catatan anomali.'
        ],
        hrDiscretionNotes: 'Kandidat memiliki integritas dan rekam jejak biodata sangat prima. Sangat direkomendasikan untuk posisi Tech Lead atau Senior Engineer.',
        generatedAt: '2025-02-18T15:00:00Z'
      },
      updatedAt: '2025-02-18T15:00:00Z'
    },
    createdAt: '2025-02-18T14:30:00Z'
  },
  {
    id: 'user-siti',
    name: 'Siti Rahmawati, S.Kom',
    email: 'siti.rahmawati@gmail.com',
    phone: '087812345678',
    role: 'applicant',
    headline: 'Machine Learning Specialist & AI Engineer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    profileCompleted: true,
    biodata: {
      fullName: 'Siti Rahmawati, S.Kom',
      birthDate: '1998-09-20',
      birthPlace: 'Bandung',
      address: 'Jl. Dago Asri No. 18',
      city: 'Bandung',
      lastEducation: 'S1',
      educationMajor: 'Ilmu Komputer',
      institutionName: 'Institut Teknologi Bandung (ITB)',
      graduationYear: '2022',
      gpa: '3.90',
      bioSummary: 'AI Researcher & ML Engineer yang berfokus pada LLM fine-tuning, RAG architecture, and computer vision.',
      profileCompleted: true,
      aiBackgroundReport: {
        personalitySummary: 'Siti Rahmawati memiliki antusiasme riset yang luar biasa, disiplin analitis tinggi, dan rekam jejak akademik cemerlang.',
        credibilityScore: 95,
        digitalFootprintScore: 95,
        careerTrajectorySummary: 'Lulusan Sarjana Ilmu Komputer ITB tahun 2022 dengan fokus spesialisasi Machine Learning, Natural Language Processing, dan implementasi arsitektur AI modern.',
        socialMediaPresenceSummary: 'Lulusan Sarjana Ilmu Komputer ITB tahun 2022 dengan fokus spesialisasi Machine Learning.',
        academicAuditSummary: 'Lulusan S1 Ilmu Komputer ITB dengan IPK 3.90 (Summa Cumlaude), rekam jejak riset akademik terbukti.',
        calculatedAge: 27,
        integrityAndEthicsScore: 97,
        greenFlags: [
          'Lulusan cumlaude ITB dengan IPK 3.90 pada jurusan Ilmu Komputer',
          'Data identitas KTP dan ijazah konsisten dengan berkas karir',
          'Fokus keahlian AI dan Machine Learning sangat relevan dengan kebutuhan industri'
        ],
        redFlags: [
          'Biodata resmi dan berkas pendukung lengkap tanpa catatan anomali.'
        ],
        hrDiscretionNotes: 'Kandidat memiliki talenta riset dan etika kerja luar biasa, sangat cocok untuk tim riset & inovasi AI.',
        generatedAt: '2025-02-19T09:15:00Z'
      },
      updatedAt: '2025-02-19T09:15:00Z'
    },
    createdAt: '2025-02-19T09:15:00Z'
  }
];

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pkg-umk',
    name: 'Paket UMK',
    category: 'UMK',
    price: 299000,
    priceFormatted: 'Rp 299.000',
    billingPeriod: '/bulan',
    description: 'Solusi rekrutmen praktis & hemat biaya khusus untuk Usaha Mikro & Kecil (UMK), rintisan, dan toko.',
    badge: 'UNTUK UMK',
    features: [
      'Hingga 5 Lowongan Kerja Aktif',
      '100 Evaluasi AI CV & Dokumen/Bulan',
      'Skor Kecocokan Otomatis (0-100)',
      'Ekstraksi Teks PDF & Word Cerdas',
      'Label Badge Khusus UMK di Katalog Loker',
      'Email Notifikasi Status Pelamar',
      'Dukungan Bantuan Teknis 24/7'
    ],
    maxJobs: 5,
    aiQuota: 100
  },
  {
    id: 'pkg-perusahaan',
    name: 'Paket Perusahaan',
    category: 'Perusahaan',
    price: 1299000,
    priceFormatted: 'Rp 1.299.000',
    billingPeriod: '/bulan',
    description: 'Paling populer untuk perusahaan menengah (PT/CV) berkembang dengan volume rekrutmen aktif.',
    badge: 'PALING POPULER',
    isPopular: true,
    features: [
      'Hingga 20 Lowongan Kerja Aktif',
      '500 Evaluasi AI CV & Dokumen/Bulan',
      'Radar Chart Kompetensi 5 Dimensi',
      'AI Custom Interview Question Generator',
      'Analisis Mendalam Strengths & Skill Gaps',
      'Label Badge Resmi Perusahaan (PT) Terverifikasi',
      'Integrasi Google Meet & Resend Notifikasi',
      'Prioritas Antrean Analisis Gemini Pro'
    ],
    maxJobs: 20,
    aiQuota: 500
  },
  {
    id: 'pkg-industri',
    name: 'Paket Industri',
    category: 'Industri',
    price: 3499000,
    priceFormatted: 'Rp 3.499.000',
    billingPeriod: '/bulan',
    description: 'Solusi tanpa batas untuk manufaktur, kawasan industri, pabrik, dan korporasi skala besar.',
    badge: 'SKALA INDUSTRI',
    features: [
      'Lowongan Kerja Tanpa Batas (Unlimited)',
      'Evaluasi AI CV & Portofolio Tanpa Batas',
      'Multi-Recruiter & Role Management HRD',
      'Label Badge Khusus Skala Industri & Manufaktur',
      'Akses API ATS & Webhook Khusus',
      'Kustom Bobot Algoritma Penilaian AI',
      'Dedicated Account Manager & SLA 99.9%'
    ],
    maxJobs: 999,
    aiQuota: 99999
  }
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-001',
    orderId: 'ORDER-ASTRA-20250110',
    companyEmail: 'sarah.wijaya@astradigital.co.id',
    companyName: 'PT Astra Digital Nusantara',
    packageName: 'Paket Industri',
    amount: 3499000,
    paymentType: 'bank_transfer (BCA)',
    status: 'settlement',
    paidAt: '2025-01-10T08:15:30Z',
    createdAt: '2025-01-10T08:00:00Z'
  },
  {
    id: 'trx-002',
    orderId: 'ORDER-MANDIRI-20250201',
    companyEmail: 'talent@mandirifintech.id',
    companyName: 'PT Mandiri Fintech Solusindo',
    packageName: 'Paket Perusahaan',
    amount: 1299000,
    paymentType: 'qris',
    status: 'settlement',
    paidAt: '2025-02-01T09:05:12Z',
    createdAt: '2025-02-01T09:00:00Z'
  },
  {
    id: 'trx-003',
    orderId: 'ORDER-KOPI-20250216',
    companyEmail: 'owner@kopicraft.id',
    companyName: 'Kopi Craft Nusantara (UMK)',
    packageName: 'Paket UMK',
    amount: 299000,
    paymentType: 'qris',
    status: 'settlement',
    paidAt: '2025-02-16T10:02:40Z',
    createdAt: '2025-02-16T10:00:00Z'
  }
];

export const SEED_JOBS: Job[] = [
  {
    id: 'job-1',
    companyId: 'comp-1',
    companyName: 'PT Astra Digital Nusantara',
    companyLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&auto=format&fit=crop&q=60',
    companyIndustry: 'Manufaktur & Otomotif',
    companyCategory: 'Industri',
    title: 'Senior Fullstack TypeScript Engineer',
    department: 'Engineering & Product',
    location: 'Jakarta Pusat (Hybrid)',
    type: 'Hybrid',
    experienceLevel: 'Senior (5+ thn)',
    salaryRange: 'Rp 22.000.000 - Rp 35.000.000',
    description: 'Kami mencari Senior Fullstack Engineer berpengalaman tinggi yang menguasai ekosistem TypeScript, Next.js, Node.js, dan arsitektur database modern untuk mengembangkan platform mobilitas pintar generasi baru.',
    requirements: [
      'Minimal 4-5 tahun pengalaman profesional dengan React, Next.js, dan Node.js / Express / NestJS.',
      'Pengalaman mendalam dengan PostgreSQL, Redis, dan query optimization.',
      'Fasih merancang REST API & GraphQL berskala tinggi.',
      'Familiar dengan Docker, CI/CD pipeline, dan deployment AWS / GCP.',
      'Pernah memimpin code review dan mentoring engineer junior.'
    ],
    responsibilities: [
      'Merancang arsitektur sistem backend dan antarmuka web modern berperforma tinggi.',
      'Mengembangkan fitur pembayaran, manajemen fleet, dan dashboard analitik.',
      'Bekerjasama dengan Product Manager dan UI/UX Designer untuk iterasi produk yang cepat.',
      'Menjaga standar kualitas kode, unit test, dan sistem keamanan data.'
    ],
    keySkills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind CSS'],
    minEducation: 'S1 Teknik Informatika / Sistem Informasi / Terkait',
    genderRequirement: 'Semua Gender',
    status: 'active',
    createdAt: '2025-02-10T08:00:00Z',
    deadline: '2026-06-30'
  },
  {
    id: 'job-2',
    companyId: 'comp-2',
    companyName: 'PT Mandiri Fintech Solusindo',
    companyLogo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=120&auto=format&fit=crop&q=60',
    companyIndustry: 'Perbankan & Fintech',
    companyCategory: 'Perusahaan',
    title: 'AI / Machine Learning Engineer',
    department: 'Artificial Intelligence & Data',
    location: 'Jakarta Selatan (Onsite)',
    type: 'Full-time',
    experienceLevel: 'Mid-Level (3-5 thn)',
    salaryRange: 'Rp 20.000.000 - Rp 30.000.000',
    description: 'Bergabunglah dengan tim AI Core Mandiri Fintech untuk membangun model deteksi penipuan transaksi, scoring kredit cerdas, dan NLP agent perbankan.',
    requirements: [
      'Pendidikan S1/S2 Ilmu Komputer, Matematika, Data Science, atau bidang terkait.',
      'Kemampuan solid dalam Python, PyTorch, Scikit-Learn, TensorFlow, dan HuggingFace.',
      'Pengalaman dalam LLM fine-tuning, RAG architecture, dan model serving (vLLM / Triton).',
      'Memahami MLOps, Docker, Kubernetes, dan pipeline data besar.'
    ],
    responsibilities: [
      'Membangun dan melatih model machine learning untuk sistem deteksi fraud real-time.',
      'Mengintegrasikan model LLM ke dalam aplikasi perbankan customer service.',
      'Melakukan monitoring drift model dan evaluasi akurasi berkelanjutan.'
    ],
    keySkills: ['Python', 'Machine Learning', 'PyTorch', 'LLM / RAG', 'Scikit-Learn', 'FastAPI', 'Docker'],
    minEducation: 'S1 / S2 Komputer / Matematika',
    genderRequirement: 'Semua Gender',
    status: 'active',
    createdAt: '2025-02-12T09:30:00Z',
    deadline: '2026-07-15'
  },
  {
    id: 'job-3',
    companyId: 'comp-3',
    companyName: 'PT Telkom Digital Inovasi',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=60',
    companyIndustry: 'Telekomunikasi & AI',
    companyCategory: 'Industri',
    title: 'Senior Product Designer (UI/UX)',
    department: 'Design & Research',
    location: 'Bandung / Remote',
    type: 'Remote',
    experienceLevel: 'Senior (5+ thn)',
    salaryRange: 'Rp 16.000.000 - Rp 25.000.000',
    description: 'Kami mencari Product Designer berbakat untuk merancang antarmuka B2B SaaS telekomunikasi yang elegan, bersih, data-dense, dan intuitif bagi ribuan pengguna perusahaan.',
    requirements: [
      'Portofolio desain UI/UX yang kuat untuk produk B2B SaaS atau Enterprise Dashboard.',
      'Keahlian tingkat lanjut dalam Figma, Design System, Auto-layout, dan Prototyping.',
      'Kemampuan conducting user research, usability testing, dan information architecture.',
      'Pemahaman kuat tentang batasan teknis frontend (HTML/CSS).'
    ],
    responsibilities: [
      'Memimpin perancangan Design System universal untuk seluruh lini produk.',
      'Merancang wireframe, mockup interaktif, dan spec handover ke developer.',
      'Melakukan riset pengguna dan mengoptimalkan metrik kepuasan SUS score.'
    ],
    keySkills: ['Figma', 'UI/UX Design', 'Design System', 'User Research', 'Prototyping', 'B2B SaaS'],
    minEducation: 'D3 / S1 Desain Komunikasi Visual / IT / Terkait',
    genderRequirement: 'Semua Gender',
    status: 'active',
    createdAt: '2025-02-15T11:00:00Z',
    deadline: '2026-08-01'
  },
  {
    id: 'job-4',
    companyId: 'comp-4',
    companyName: 'Kopi Craft Nusantara (UMK)',
    companyLogo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=120&auto=format&fit=crop&q=80',
    companyIndustry: 'Kuliner & F&B (UMK)',
    companyCategory: 'UMK',
    title: 'Head Barista & Operational Lead',
    department: 'Operasional & Bar',
    location: 'Jakarta Selatan (Onsite)',
    type: 'Full-time',
    experienceLevel: 'Junior (1-2 thn)',
    salaryRange: 'Rp 4.800.000 - Rp 6.500.000',
    description: 'Dicari Head Barista yang energik dan memiliki passion tinggi dalam specialty coffee nusantara untuk memimpin operasional harian outlet kedai kopi UMK kami di Senopati.',
    requirements: [
      'Pengalaman minimal 1-2 tahun sebagai Barista / Senior Barista.',
      'Menguasai teknik manual brew (V60, Aeropress, Kalita) dan espresso calibration.',
      'Memiliki kemampuan komunikasi ramah dan pelayanan pelanggan prima.',
      'Mampu mengelola inventaris bahan baku dan shift tim barista.'
    ],
    responsibilities: [
      'Menyajikan seduhan kopi berkualitas tinggi sesuai SOP kedai.',
      'Mengelola stok beans, susu, dan bahan baku harian.',
      'Melatih barista junior dalam teknik seduh dan hospitality.'
    ],
    keySkills: ['Manual Brew', 'Espresso Machine', 'Hospitality', 'Stock Management', 'Team Leadership'],
    minEducation: 'SMA / SMK Sederajat',
    genderRequirement: 'Laki-laki',
    status: 'active',
    createdAt: '2025-02-16T12:00:00Z',
    deadline: '2026-09-01'
  },
  {
    id: 'job-5',
    companyId: 'comp-5',
    companyName: 'Studio Desain Lumina (UMK)',
    companyLogo: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=120&auto=format&fit=crop&q=80',
    companyIndustry: 'Kreatif & Desain (UMK)',
    companyCategory: 'UMK',
    title: 'Creative Graphic & Social Media Designer',
    department: 'Creative & Social Media',
    location: 'Bandung (Hybrid)',
    type: 'Hybrid',
    experienceLevel: 'Entry-Level',
    salaryRange: 'Rp 4.500.000 - Rp 6.000.000',
    description: 'Studio Desain Lumina mencari talenta kreatif muda untuk merancang aset visual media sosial, motion graphics ringan, dan banner promosi untuk klien-klien brand lokal.',
    requirements: [
      'Menguasai Adobe Illustrator, Photoshop, dan Canva / Figma.',
      'Memiliki portofolio konten visual media sosial (Instagram, TikTok, Behance).',
      'Paham tren visual terkini, tipografi, dan komposisi warna modern.',
      'Kreatif, komunikatif, dan mampu bekerja dengan deadline yang fleksibel.'
    ],
    responsibilities: [
      'Membuat konten visual feed Instagram, carousel, dan story promosi klien.',
      'Merancang visual identity pendukung (icon, logo layout, flyer digital).',
      'Bekerja sama dengan Social Media Strategist dalam eksekusi campaign.'
    ],
    keySkills: ['Adobe Illustrator', 'Photoshop', 'Figma', 'Social Media Design', 'Visual Branding'],
    minEducation: 'SMK Multimedia / D3 / S1 Desain',
    genderRequirement: 'Perempuan',
    status: 'active',
    createdAt: '2025-02-17T13:00:00Z',
    deadline: '2026-09-15'
  }
];

export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Senior Fullstack TypeScript Engineer',
    jobDepartment: 'Engineering & Product',
    companyId: 'comp-1',
    companyName: 'PT Astra Digital Nusantara',
    userId: 'user-budi',
    applicantName: 'Budi Santoso',
    applicantEmail: 'budi.santoso@gmail.com',
    applicantPhone: '081234567890',
    applicantHeadline: 'Senior Fullstack TypeScript & Cloud Engineer',
    appliedDate: '2025-02-18T15:00:00Z',
    status: 'interview',
    hrNotes: 'Kandidat sangat potensial dengan pengalaman 5 tahun di TypeScript dan Next.js. Terjadwal wawancara teknis Kamis.',
    documents: [
      {
        id: 'doc-1',
        name: 'CV_Budi_Santoso_Senior_Engineer.pdf',
        type: 'cv',
        size: 340000,
        extractedText: `BUDI SANTOSO
Senior Fullstack Engineer | Jakarta, Indonesia
Email: budi.santoso@gmail.com | Phone: 081234567890 | GitHub: github.com/budisantoso-dev

RINGKASAN PROFESIONAL:
Software Engineer dengan pengalaman 5+ tahun membangun aplikasi web berskala enterprise menggunakan ekosistem TypeScript, Next.js, React, Node.js, dan PostgreSQL. Terbiasa dengan arsitektur microservices, AWS cloud deployment, dan optimasi query database.

PENGALAMAN KERJA:
1. Senior Fullstack Developer - TechCorp Indonesia (2022 - Sekarang)
- Memimpin pengembangan arsitektur core dashboard B2B menggunakan Next.js App Router, TypeScript, dan Tailwind CSS.
- Mengurangi latency API sebesar 40% melalui implementasi caching Redis dan indexing PostgreSQL yang efisien.
- Mengelola CI/CD pipeline menggunakan GitHub Actions dan Docker container di AWS ECS.

2. Fullstack Engineer - PT Digital Karya Bangsa (2019 - 2022)
- Mengembangkan RESTful API dengan Express.js dan NestJS untuk platform e-commerce dengan 500k MAU.
- Mengintegrasikan payment gateway Midtrans dan Xendit dengan webhook handling yang reliabel.

KEAHLIAN TEKNIS:
- Bahasa: TypeScript, JavaScript, SQL, Go (Dasar)
- Frontend: React.js, Next.js, Tailwind CSS, State Management (Zustand/Redux)
- Backend & DB: Node.js, Express, NestJS, PostgreSQL, Redis, Prisma ORM
- DevOps & Tools: Git, Docker, AWS (S3, ECS, RDS), CI/CD, Jest

PENDIDIKAN:
S1 Teknik Informatika - Universitas Indonesia (IPK: 3.82 / 4.00, Lulus 2019)`,
        uploadedAt: '2025-02-18T15:00:00Z'
      }
    ],
    aiEvaluation: {
      overallScore: 92,
      technicalScore: 95,
      experienceScore: 92,
      educationScore: 90,
      motivationScore: 88,
      cultureFitScore: 91,
      fitLevel: 'Top Match',
      recommendation: 'STRONGLY_RECOMMENDED',
      executiveSummary: 'Budi Santoso merupakan kandidat berperingkat sangat tinggi (Top Match) dengan kesesuaian keahlian teknis dan pengalaman kerja yang hampir sempurna terhadap kriteria posisi Senior Fullstack TypeScript Engineer di PT Astra Digital Nusantara. Pengalamannya selama 5 tahun dengan Next.js, Node.js, PostgreSQL, dan integrasi Midtrans langsung relevan dengan proyek platform Astra.',
      recommendationReason: 'Kandidat memiliki rekam jejak kepemimpinan teknis yang terbukti, penguasaan stack yang identik (TypeScript, Next.js, PostgreSQL, Docker), serta latar belakang akademis unggul dari Universitas Indonesia.',
      strengths: [
        'Penguasaan mendalam ekosistem modern: TypeScript, Next.js App Router, Tailwind, dan Node.js.',
        'Pengalaman nyata dalam optimasi performa backend (reduksi latency 40% dan indexing PostgreSQL).',
        'Familiaritas langsung dengan integrasi payment gateway Midtrans dan arsitektur cloud AWS.'
      ],
      gaps: [
        'Belum banyak mencantumkan pengalaman arsitektur Event-Driven dengan Apache Kafka / RabbitMQ.',
        'Portofolio pengujian otomatis (E2E testing dengan Playwright / Cypress) dapat digali lebih jauh saat wawancara.'
      ],
      matchedSkills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind CSS'],
      missingSkills: ['GraphQL'],
      suggestedInterviewQuestions: [
        'Bagaimana pendekatan Anda dalam merancang caching strategy multi-tier antara Next.js Server Components, Redis, dan database PostgreSQL?',
        'Ceritakan pengalaman Anda saat menangani lonjakan transaksi serentak (concurrency) dan bagaimana mencegah race condition?',
        'Bagaimana standar Anda dalam memimpin code review dan menjaga konsistensi arsitektur di tim engineering?'
      ],
      detailedQuestions: [
        {
          question: 'Bagaimana pendekatan Anda dalam merancang caching strategy multi-tier antara Next.js Server Components, Redis, dan database PostgreSQL?',
          context: 'Kandidat mencatat keberhasilan mengurangi latency 40% di TechCorp.',
          targetCriteria: 'Kandidat dapat menjelaskan stale-while-revalidate, cache tagging, dan invalidation mechanism yang tepat.'
        },
        {
          question: 'Ceritakan pengalaman Anda saat menangani webhook payment gateway yang asynchronous dan idempoten?',
          context: 'Kandidat pernah mengintegrasikan Midtrans di PT Digital Karya Bangsa.',
          targetCriteria: 'Memahami signature validation, idempotency key, retry backoff, dan status settlement transaction.'
        }
      ],
      isRealAi: true,
      modelUsed: 'gemini-2.5-flash',
      latencyMs: 1420,
      analyzedAt: '2025-02-18T15:00:15Z'
    }
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    jobTitle: 'AI / Machine Learning Engineer',
    jobDepartment: 'Artificial Intelligence & Data',
    companyId: 'comp-2',
    companyName: 'PT Mandiri Fintech Solusindo',
    userId: 'user-siti',
    applicantName: 'Siti Rahmawati, S.Kom',
    applicantEmail: 'siti.rahmawati@gmail.com',
    applicantPhone: '087812345678',
    applicantHeadline: 'Machine Learning Specialist & AI Engineer',
    appliedDate: '2025-02-19T10:00:00Z',
    status: 'screening',
    hrNotes: 'Dokumen lengkap, skor AI tinggi untuk kompetensi PyTorch dan NLP.',
    documents: [
      {
        id: 'doc-2',
        name: 'CV_Siti_Rahmawati_AI_Engineer.pdf',
        type: 'cv',
        size: 280000,
        extractedText: `SITI RAHMAWATI, S.Kom
AI & Machine Learning Engineer | Jakarta, Indonesia
Email: siti.rahmawati@gmail.com | LinkedIn: linkedin.com/in/sitirahmawati

PROFIL:
Machine Learning Engineer dengan pengalaman 3.5 tahun dalam pengembangan model Natural Language Processing (NLP), Large Language Model (LLM) fine-tuning, RAG systems, dan model fraud detection di industri perbankan digital.

KEAHLIAN:
- Bahasa: Python, SQL, C++
- Frameworks: PyTorch, TensorFlow, Scikit-learn, HuggingFace Transformers, LangChain, LlamaIndex
- MLOps: MLflow, Docker, FastAPI, Kubernetes, Triton Inference Server

PENGALAMAN KERJA:
1. Machine Learning Engineer - FinAI Solusi (2022 - Sekarang)
- Mengembangkan model credit scoring berbasis XGBoost dan Neural Networks dengan akurasi AUC 0.91.
- Membangun enterprise RAG pipeline untuk automated customer assistant menggunakan vector database Qdrant dan vLLM.
- Mengurangi waktu inferensi model NLP hingga 3x menggunakan ONNX runtime.

PENDIDIKAN:
S1 Ilmu Komputer - Institut Teknologi Bandung (ITB) (2018 - 2022)`,
        uploadedAt: '2025-02-19T10:00:00Z'
      }
    ],
    aiEvaluation: {
      overallScore: 89,
      technicalScore: 94,
      experienceScore: 88,
      educationScore: 92,
      motivationScore: 85,
      cultureFitScore: 88,
      fitLevel: 'Top Match',
      recommendation: 'STRONGLY_RECOMMENDED',
      executiveSummary: 'Siti Rahmawati memiliki profil yang sangat selaras dengan kebutuhan AI / Machine Learning Engineer di Mandiri Fintech. Pengalamannya membangun sistem credit scoring, fine-tuning LLM, dan RAG pipeline di industri fintech menjadikannya kandidat yang siap berkontribusi secara instan.',
      recommendationReason: 'Kecocokan domain finansial yang kuat, latar belakang ITB, dan penguasaan stack Python/PyTorch/RAG yang terbukti.',
      strengths: [
        'Pengalaman spesifik di AI FinTech (Credit Scoring & Fraud Detection dengan AUC 0.91).',
        'Penguasaan stack LLM modern (HuggingFace, LangChain, LlamaIndex, Triton, Qdrant).',
        'Lulusan Ilmu Komputer ITB dengan fondasi matematika dan algoritma yang kuat.'
      ],
      gaps: [
        'Pengalaman dengan arsitektur microservices non-Python masih terbatas.'
      ],
      matchedSkills: ['Python', 'Machine Learning', 'PyTorch', 'LLM / RAG', 'Scikit-Learn', 'FastAPI', 'Docker'],
      missingSkills: [],
      suggestedInterviewQuestions: [
        'Bagaimana strategi Anda mengatasi data imbalance ekstrem pada kasus deteksi fraud transaksi?',
        'Jelaskan arsitektur RAG yang Anda bangun dan bagaimana Anda mengevaluasi tingkat halusinasi LLM?'
      ],
      isRealAi: true,
      modelUsed: 'gemini-2.5-flash',
      latencyMs: 1280,
      analyzedAt: '2025-02-19T10:00:18Z'
    }
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  aiModel: 'gemini-2.5-flash',
  autoScreening: true,
  minPassingScore: 70,
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY || '',
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || ''
};
