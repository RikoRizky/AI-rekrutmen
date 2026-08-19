import { Job, Application, User } from './types';

export const SEED_USERS: User[] = [
  {
    id: 'user-hrd-1',
    name: 'Sarah Pratama, S.Psi, CHRP',
    email: 'sarah.hrd@technova.co.id',
    phone: '081234567890',
    role: 'hrd',
    headline: 'Senior Talent Acquisition Lead at TechNova Solutions',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'user-pelamar-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    phone: '081398765432',
    role: 'applicant',
    headline: 'Full-Stack Developer | React, Next.js, Node.js & TypeScript Specialist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'user-pelamar-2',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@outlook.com',
    phone: '082155667788',
    role: 'applicant',
    headline: 'Senior Frontend Engineer | UI/UX Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-02T11:30:00Z',
  },
  {
    id: 'user-pelamar-3',
    name: 'Siti Rahmawati',
    email: 'siti.rahmawati@gmail.com',
    phone: '081987654321',
    role: 'applicant',
    headline: 'Junior Web Developer | Fresh Graduate Ilmu Komputer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-03T09:15:00Z',
  },
  {
    id: 'user-pelamar-4',
    name: 'Rian Hidayat',
    email: 'rian.hidayat@yahoo.com',
    phone: '085712345678',
    role: 'applicant',
    headline: 'Graphic Designer & Digital Marketing (Career Switcher)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-04T14:20:00Z',
  },
];

export const SEED_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer (React & Next.js)',
    department: 'Engineering & Technology',
    location: 'Jakarta Selatan (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Senior (5+ thn)',
    salaryRange: 'Rp 18.000.000 - Rp 26.000.000 / bulan',
    description: 'Kami mencari Senior Frontend Engineer yang berpengalaman dalam membangun aplikasi web modern berskala besar menggunakan React 18+, Next.js App Router, TypeScript, dan Tailwind CSS. Posisi ini akan memimpin arsitektur antarmuka pengguna, optimasi web performance, serta integrasi AI-driven features.',
    requirements: [
      'Minimal 4-5 tahun pengalaman profesional pengembangan web modern',
      'Keahlian mendalam dalam TypeScript, React.js, Next.js (App Router), dan Tailwind CSS',
      'Pemahaman kuat tentang State Management (Zustand/Redux/React Query)',
      'Pengalaman dengan Web Performance Optimization, Core Web Vitals, dan SEO',
      'Memiliki portofolio aplikasi web live yang responsif dan performan',
      'Kemampuan komunikasi yang baik dan pengalaman memimpin/mentoring junior engineer',
      'Gelar S1 Teknik Informatika, Sistem Informasi, atau pengalaman industri setara'
    ],
    responsibilities: [
      'Merancang arsitektur frontend yang scalable, modular, dan maintainable',
      'Berkolaborasi erat dengan tim UI/UX Designer dan Backend Engineer',
      'Mengoptimalkan kecepatan rendering dan performa aplikasi di berbagai perangkat',
      'Melakukan code review dan menetapkan standar best practices frontend tim'
    ],
    keySkills: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'State Management', 'REST API / GraphQL', 'Web Performance'],
    minEducation: 'S1 Teknik Informatika / Ilmu Komputer / Setara',
    status: 'active',
    createdAt: '2026-02-10T08:00:00Z',
    deadline: '2026-03-31'
  },
  {
    id: 'job-2',
    title: 'Talent Acquisition & HR Specialist',
    department: 'Human Resources & People Ops',
    location: 'Jakarta Pusat (Onsite)',
    type: 'Full-time',
    experienceLevel: 'Mid-Level (3-5 thn)',
    salaryRange: 'Rp 9.000.000 - Rp 14.000.000 / bulan',
    description: 'Bertanggung jawab atas seluruh end-to-end proses rekrutmen talent teknologi dan operasional, mulai dari sourcing kandidat, screening awal menggunakan sistem AI ATS, wawancara kompetensi (BEI), hingga proses onboarding karyawan baru.',
    requirements: [
      'Minimal 3 tahun pengalaman di bidang Talent Acquisition / Rekrutmen Tech',
      'Menguasai teknik Behavioral Event Interview (BEI) dan alat psikometri',
      'Fasih menggunakan Applicant Tracking System (ATS) dan platform sourcing (LinkedIn Recruiter)',
      'Memiliki sertifikasi HR (CHRP / BNSP) menjadi nilai tambah yang besar',
      'Gelar S1 Psikologi atau Manajemen SDM dengan IPK min. 3.25'
    ],
    responsibilities: [
      'Melakukan sourcing dan screening kandidat untuk posisi teknis & non-teknis',
      'Mengkoordinasikan jadwal wawancara antara kandidat dan hiring manager',
      'Mengelola employer branding dan program magang kampus'
    ],
    keySkills: ['Talent Sourcing', 'ATS System', 'Behavioral Interview (BEI)', 'Employer Branding', 'Psychological Testing', 'HR Analytics'],
    minEducation: 'S1 Psikologi / Manajemen SDM',
    status: 'active',
    createdAt: '2026-02-12T09:00:00Z',
    deadline: '2026-03-25'
  },
  {
    id: 'job-3',
    title: 'AI & Data Analyst Specialist',
    department: 'Data & Analytics',
    location: 'Bandung / Remote',
    type: 'Remote',
    experienceLevel: 'Mid-Level (3-5 thn)',
    salaryRange: 'Rp 14.000.000 - Rp 20.000.000 / bulan',
    description: 'Menganalisis data bisnis dan model AI untuk memberikan insight strategis bagi manajemen. Membangun visualisasi dashboard interaktif dan mengolah pipeline data terstruktur.',
    requirements: [
      'Pengalaman 2-4 tahun dalam data analysis, modeling statistik, atau business intelligence',
      'Keahlian tingkat lanjut dalam SQL, Python (Pandas, NumPy, Scikit-learn), dan Power BI / Tableau',
      'Pemahaman tentang integrasi Large Language Models (LLM APIs) dan pemrosesan NLP',
      'Lulusan S1 Matematika, Statistika, Informatika, atau bidang kuantitatif terkait'
    ],
    responsibilities: [
      'Mengembangkan model analitik prediktif dan automated reporting',
      'Menyajikan temuan analisis kepada stakeholder bisnis dalam bahasa yang mudah dipahami'
    ],
    keySkills: ['Python', 'SQL', 'Tableau / Power BI', 'Data Modeling', 'Machine Learning Basics', 'Statistical Analysis'],
    minEducation: 'S1 Statistika / Matematika / Ilmu Komputer',
    status: 'active',
    createdAt: '2026-02-15T10:00:00Z',
    deadline: '2026-04-10'
  }
];

export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Engineer (React & Next.js)',
    jobDepartment: 'Engineering & Technology',
    userId: 'user-pelamar-2',
    applicantName: 'Ahmad Fauzi',
    applicantEmail: 'ahmad.fauzi@outlook.com',
    applicantPhone: '082155667788',
    appliedDate: '2026-02-16T14:30:00Z',
    status: 'interview',
    documents: [
      {
        id: 'doc-1',
        name: 'CV_Ahmad_Fauzi_Senior_Frontend.pdf',
        type: 'cv',
        size: 245000,
        extractedText: `RINGKASAN PROFIL:
Senior Frontend Engineer dengan 5+ tahun pengalaman dalam ekosistem React, Next.js, TypeScript, dan Tailwind CSS. Berhasil memimpin migrasi monolitik ke micro-frontend yang meningkatkan waktu muat halaman sebesar 42%.

PENGALAMAN KERJA:
1. Lead Frontend Engineer - PT Inovasi Digital Nusantara (2022 - Sekarang)
- Memimpin tim 6 frontend engineer dalam membangun platform e-commerce dengan Next.js App Router, Tailwind CSS, dan Zustand.
- Mengimplementasikan Server-Side Rendering (SSR) & Incremental Static Regeneration (ISR) yang mendongkrak Core Web Vitals hingga skor 98.
- Merancang Design System internal berbasis Tailwind CSS & Radix UI.

2. Frontend Developer - PT Solusi Tekno Mandiri (2019 - 2022)
- Mengembangkan dashboard analitik dengan React, TypeScript, GraphQL, dan Chart.js.
- Mengintegrasikan REST APIs dengan React Query dan optimasi caching.

PENDIDIKAN:
S1 Teknik Informatika - Universitas Indonesia (IPK 3.82) (2015 - 2019)

KEAHLIAN TEKNIS:
JavaScript (ES6+), TypeScript, React.js, Next.js, Tailwind CSS, Zustand, Redux Toolkit, GraphQL, Jest, Webpack/Vite, CI/CD, Git.`,
        uploadedAt: '2026-02-16T14:28:00Z'
      },
      {
        id: 'doc-2',
        name: 'Surat_Lamaran_Ahmad_Fauzi.pdf',
        type: 'cover_letter',
        size: 112000,
        extractedText: `Kepada Yth. Tim Rekrutmen TechNova Solutions,

Saya menulis surat ini untuk menyatakan ketertarikan mendalam saya pada posisi Senior Frontend Engineer. Dengan rekam jejak lebih dari 5 tahun dalam arsitektur React dan Next.js, saya yakin dapat membawa dampak signifikan dalam akselerasi produk dan standarisasi antarmuka di perusahaan Anda.

Saya sangat terinspirasi oleh inovasi TechNova dalam mengintegrasikan AI ke dalam platform rekrutmen. Besar harapan saya untuk dapat mendiskusikan bagaimana pengalaman saya dalam Web Performance dan UI Engineering dapat mendukung target perusahaan.

Hormat saya,
Ahmad Fauzi`,
        uploadedAt: '2026-02-16T14:29:00Z'
      },
      {
        id: 'doc-3',
        name: 'Sertifikat_Meta_Frontend_Professional.pdf',
        type: 'certificate',
        size: 380000,
        extractedText: `Meta Certified Advanced Frontend Developer & React Specialization - Credential ID: META-FE-99281`,
        uploadedAt: '2026-02-16T14:30:00Z'
      }
    ],
    aiEvaluation: {
      overallScore: 95,
      technicalScore: 98,
      experienceScore: 94,
      educationScore: 92,
      motivationScore: 95,
      fitLevel: 'Top Match',
      executiveSummary: 'Kandidat sangat luar biasa dan memiliki kesesuaian sempurna dengan kualifikasi Senior Frontend Engineer. Memiliki pengalaman 5+ tahun langsung di React, Next.js App Router, TypeScript, dan kepemimpinan tim teknis serta portofolio Core Web Vitals yang terbukti.',
      strengths: [
        'Keahlian teknis mencakup 100% stack yang disyaratkan (React, Next.js, TypeScript, Tailwind, Zustand)',
        'Pengalaman kepemimpinan tim frontend (6 engineers) dan arsitektur Design System',
        'Rekam jejak optimasi performa nyata (peningkatan Core Web Vitals ke 98)',
        'Pendidikan S1 Teknik Informatika UI dengan IPK tinggi (3.82) dan sertifikasi resmi Meta'
      ],
      gaps: [
        'Belum tertera eksplisit pengalaman langsung mengenai integrasi LLM/AI prompt di frontend, namun sangat mudah dipelajari berkat fondasi TypeScript yang solid.'
      ],
      matchedSkills: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'State Management', 'REST API / GraphQL', 'Web Performance'],
      missingSkills: [],
      recommendation: 'STRONGLY_RECOMMENDED',
      recommendationReason: 'Kandidat berada di persentil 1% teratas pelamar. Sangat disarankan untuk segera dijadwalkan wawancara teknis tingkat lanjut.',
      suggestedInterviewQuestions: [
        'Ceritakan bagaimana strategi Anda mengelola caching dan Server-Side Rendering pada Next.js App Router saat migrasi platform besar.',
        'Bagaimana pendekatan Anda dalam memimpin code review dan menjaga konsistensi arsitektur di tim beranggotakan 6 orang?',
        'Pengalaman apa yang paling menantang ketika mengoptimalkan Core Web Vitals (LCP/CLS) pada aplikasi berkecepatan tinggi?'
      ],
      analyzedAt: '2026-02-16T14:31:00Z'
    },
    hrNotes: 'Kandidat prioritas utama. Dijadwalkan interview teknis Kamis jam 14:00.'
  },
  {
    id: 'app-2',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Engineer (React & Next.js)',
    jobDepartment: 'Engineering & Technology',
    userId: 'user-pelamar-1',
    applicantName: 'Budi Santoso',
    applicantEmail: 'budi.santoso@gmail.com',
    applicantPhone: '081398765432',
    appliedDate: '2026-02-17T10:15:00Z',
    status: 'screening',
    documents: [
      {
        id: 'doc-4',
        name: 'CV_Budi_Santoso_Fullstack.pdf',
        type: 'cv',
        size: 198000,
        extractedText: `PROFIL:
Software Developer dengan 3 tahun pengalaman membuat aplikasi web berbasis React, Node.js, Express, dan PostgreSQL. Terbiasa bekerja dengan metodologi Agile/Scrum.

PENGALAMAN:
Full-Stack Web Developer - PT Cahaya Tech Solusindo (2023 - Sekarang)
- Membangun antarmuka dashboard admin menggunakan React.js dan Bootstrap/Tailwind.
- Membuat RESTful API dengan Node.js Express dan integrasi PostgreSQL database.
- Bekerja dalam tim sprint 2 mingguan.

PENDIDIKAN:
S1 Sistem Informasi - Universitas Gunadarma (IPK 3.40) (2018 - 2022)

SKILLS:
JavaScript, React.js, HTML5, CSS3, Tailwind CSS, Node.js, Express, PostgreSQL, Git. Sedang mempelajari Next.js dan TypeScript.`,
        uploadedAt: '2026-02-17T10:14:00Z'
      },
      {
        id: 'doc-5',
        name: 'Surat_Lamaran_Budi_Santoso.pdf',
        type: 'cover_letter',
        size: 89000,
        extractedText: `Yth. HRD TechNova Solutions,
Saya bermaksud melamar untuk posisi Frontend Engineer. Saya memiliki antusiasme tinggi untuk terus berkembang dan siap mempelajari teknologi Next.js & TypeScript secara intensif. Terima kasih.`,
        uploadedAt: '2026-02-17T10:15:00Z'
      }
    ],
    aiEvaluation: {
      overallScore: 72,
      technicalScore: 68,
      experienceScore: 70,
      educationScore: 80,
      motivationScore: 75,
      fitLevel: 'Moderate Match',
      executiveSummary: 'Kandidat memiliki fondasi web development dan React.js yang cukup baik (3 tahun pengalaman), namun saat ini lebih berkualifikasi sebagai Mid-Level Developer daripada Senior Engineer. Masih tahap awal dalam penguasaan Next.js dan TypeScript.',
      strengths: [
        'Memiliki pengalaman praktis 3 tahun dengan React.js dan Tailwind CSS',
        'Latar belakang fullstack (mengerti integrasi backend REST API & database)',
        'Pendidikan S1 Sistem Informasi yang relevan'
      ],
      gaps: [
        'Tahun pengalaman (3 tahun) belum memenuhi kualifikasi Senior (5+ tahun)',
        'TypeScript dan Next.js masih dalam tahap pembelajaran, belum ada portofolio produksi berskala enterprise',
        'Belum memiliki pengalaman kepemimpinan teknis atau arsitektur micro-frontend'
      ],
      matchedSkills: ['React.js', 'Tailwind CSS', 'REST API / GraphQL'],
      missingSkills: ['Next.js', 'TypeScript', 'State Management', 'Web Performance'],
      recommendation: 'CONSIDER',
      recommendationReason: 'Potensial untuk posisi Mid-Level Frontend Engineer jika dibuka, namun perlu pembuktian lebih lanjut untuk posisi Senior.',
      suggestedInterviewQuestions: [
        'Bagaimana Anda mengelola state global dalam aplikasi React yang kompleks selama ini?',
        'Apa langkah yang sedang Anda ambil untuk mempercepat penguasaan TypeScript dan Next.js App Router?'
      ],
      analyzedAt: '2026-02-17T10:16:00Z'
    },
    hrNotes: 'Bisa dipertimbangkan jika mencari backup mid-level.'
  },
  {
    id: 'app-3',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Engineer (React & Next.js)',
    jobDepartment: 'Engineering & Technology',
    userId: 'user-pelamar-3',
    applicantName: 'Siti Rahmawati',
    applicantEmail: 'siti.rahmawati@gmail.com',
    applicantPhone: '081987654321',
    appliedDate: '2026-02-18T09:00:00Z',
    status: 'applied',
    documents: [
      {
        id: 'doc-6',
        name: 'CV_Siti_Rahmawati_FreshGrad.pdf',
        type: 'cv',
        size: 154000,
        extractedText: `PROFIL:
Fresh Graduate S1 Ilmu Komputer yang bersemangat dalam front-end development. Memiliki beberapa proyek skripsi dan magang 3 bulan membangun landing page HTML/CSS/JavaScript dan React sederhana.

PENGALAMAN:
Frontend Intern - Startup Lokal (3 Bulan - 2025)
- Membantu slicing desain Figma ke React.js dan Tailwind CSS.
- Memperbaiki bug tampilan responsif pada mobile browser.

PENDIDIKAN:
S1 Ilmu Komputer - Institut Pertanian Bogor (IPK 3.65) (2021 - 2025)

KEAHLIAN:
HTML, CSS, JavaScript, React.js Dasar, Tailwind CSS, Git, Figma.`,
        uploadedAt: '2026-02-18T08:58:00Z'
      }
    ],
    aiEvaluation: {
      overallScore: 48,
      technicalScore: 45,
      experienceScore: 35,
      educationScore: 85,
      motivationScore: 70,
      fitLevel: 'Low Match',
      executiveSummary: 'Kandidat merupakan lulusan baru (Fresh Graduate) berpotensi dengan latar belakang akademik yang baik, namun belum memenuhi kriteria Senior Engineer (5+ tahun pengalaman kerja nyata).',
      strengths: [
        'Lulusan S1 Ilmu Komputer IPK 3.65 dengan pemahaman dasar React dan Tailwind',
        'Memiliki etos belajar yang tinggi dan pengalaman magang'
      ],
      gaps: [
        'Tidak memiliki pengalaman kerja profesional 4-5 tahun sesuai prasyarat lowongan Senior',
        'Belum menguasai TypeScript tingkat lanjut, Next.js SSR, atau arsitektur skala besar',
        'Belum terbiasa dengan kepemimpinan proyek atau mentoring'
      ],
      matchedSkills: ['React.js', 'Tailwind CSS'],
      missingSkills: ['Next.js', 'TypeScript', 'State Management', 'Web Performance', 'REST API / GraphQL'],
      recommendation: 'NOT_SUITABLE',
      recommendationReason: 'Kesenjangan pengalaman terlalu jauh untuk level Senior, lebih cocok dialihkan ke program Graduate / Junior Frontend Developer.',
      suggestedInterviewQuestions: [
        'Ceritakan proyek skripsi Anda dan tantangan pemrograman terbesar yang Anda selesaikan.'
      ],
      analyzedAt: '2026-02-18T09:02:00Z'
    }
  },
  {
    id: 'app-4',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Engineer (React & Next.js)',
    jobDepartment: 'Engineering & Technology',
    userId: 'user-pelamar-4',
    applicantName: 'Rian Hidayat',
    applicantEmail: 'rian.hidayat@yahoo.com',
    applicantPhone: '085712345678',
    appliedDate: '2026-02-18T16:20:00Z',
    status: 'rejected',
    documents: [
      {
        id: 'doc-7',
        name: 'CV_Rian_Designer.pdf',
        type: 'cv',
        size: 420000,
        extractedText: `PROFIL:
Graphic Designer & Digital Marketer dengan pengalaman 4 tahun di agensi kreatif. Menguasai Adobe Photoshop, Illustrator, Canva, Meta Ads, dan WordPress.

PENGALAMAN:
Creative Lead - Agensi Media Kreatif (2022 - Sekarang)
- Mendesain konten visual media sosial dan materi promosi klien.
- Mengelola website WordPress dan konten SEO.

PENDIDIKAN:
S1 Desain Komunikasi Visual (DKV) - Universitas Trisakti`,
        uploadedAt: '2026-02-18T16:18:00Z'
      }
    ],
    aiEvaluation: {
      overallScore: 28,
      technicalScore: 15,
      experienceScore: 20,
      educationScore: 40,
      motivationScore: 50,
      fitLevel: 'Low Match',
      executiveSummary: 'Profil kandidat tidak sesuai dengan bidang lowongan. Pengalaman berfokus pada Desain Grafis dan Digital Marketing, tanpa latar belakang pemrograman React/Next.js/TypeScript.',
      strengths: [
        'Pengalaman visual design dan kreativitas agensi'
      ],
      gaps: [
        'Tidak memiliki keahlian pemrograman frontend (React, Next.js, TypeScript)',
        'Latar belakang profesi berbeda dengan kualifikasi teknis yang dibutuhkan'
      ],
      matchedSkills: [],
      missingSkills: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'State Management', 'REST API / GraphQL', 'Web Performance'],
      recommendation: 'NOT_SUITABLE',
      recommendationReason: 'Kandidat tidak memenuhi prasyarat dasar posisi engineering.',
      suggestedInterviewQuestions: [],
      analyzedAt: '2026-02-18T16:22:00Z'
    }
  }
];

export const DEFAULT_SETTINGS = {
  geminiApiKey: '',
  aiModel: 'gemini-3.6-flash',
  autoScreening: true,
  minPassingScore: 70
};
