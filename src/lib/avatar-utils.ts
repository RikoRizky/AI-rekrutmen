// Shared Avatar & Logo Generator Utilities (Server & Client compatible)

export function getDefaultUserAvatar(name: string): string {
  const cleanName = (name || 'Pelamar').trim();
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PL';

  const colors = [
    { from: '#059669', to: '#047857', ring: '#10b981', badgeBg: '#064e3b' }, // Emerald Green
    { from: '#0d9488', to: '#0f766e', ring: '#2dd4bf', badgeBg: '#134e4a' }, // Teal
    { from: '#10b981', to: '#059669', ring: '#34d399', badgeBg: '#064e3b' }, // Mint
    { from: '#15803d', to: '#166534', ring: '#4ade80', badgeBg: '#14532d' }, // Forest Green
    { from: '#0f766e', to: '#115e59', ring: '#2dd4bf', badgeBg: '#134e4a' }  // Deep Teal
  ];
  const charCodeSum = cleanName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.from}" />
        <stop offset="100%" stop-color="${color.to}" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="#090d16" />
    <circle cx="64" cy="64" r="54" fill="url(#userGrad)" />
    <!-- Candidate Silhouette -->
    <circle cx="64" cy="46" r="18" fill="#ffffff" fill-opacity="0.95" />
    <path d="M36 96c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="#ffffff" fill-opacity="0.95" />
    <!-- Candidate Initials Pill Badge -->
    <rect x="36" y="90" width="56" height="24" rx="12" fill="${color.badgeBg}" stroke="${color.ring}" stroke-width="2" />
    <text x="64" y="106" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getDefaultCompanyLogo(name: string): string {
  const cleanName = (name || 'PT Perusahaan').trim();
  
  // Intelligent Company Initials Extraction (strip PT, CV, etc.)
  const withoutPrefix = cleanName.replace(/^(PT\.?|CV\.?|UD\.?|INC\.?|CORP\.?|LTD\.?)\s+/i, '').trim();
  let initials = '';
  if (withoutPrefix.length > 0 && withoutPrefix.length <= 4) {
    initials = withoutPrefix.toUpperCase();
  } else {
    const words = withoutPrefix.split(' ').filter(Boolean);
    if (words.length === 1) {
      initials = words[0].slice(0, 3).toUpperCase();
    } else {
      initials = words.map((w) => w[0]).slice(0, 3).join('').toUpperCase();
    }
  }
  if (!initials) initials = 'PT';

  const colors = [
    { from: '#1e3a8a', to: '#172554', accent: '#38bdf8', glow: '#60a5fa', badgeBg: '#0f172a' }, // Deep Navy Blue
    { from: '#0369a1', to: '#075985', accent: '#38bdf8', glow: '#7dd3fc', badgeBg: '#0c4a6e' }, // Sapphire Ocean
    { from: '#312e81', to: '#1e1b4b', accent: '#818cf8', glow: '#a5b4fc', badgeBg: '#1e1b4b' }, // Royal Indigo
    { from: '#1e293b', to: '#0f172a', accent: '#60a5fa', glow: '#93c5fd', badgeBg: '#020617' }, // Corporate Steel
    { from: '#1e40af', to: '#1e3a8a', accent: '#67e8f9', glow: '#a5f3fc', badgeBg: '#172554' }  // Cobalt Blue
  ];
  const charCodeSum = cleanName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.from}" />
        <stop offset="100%" stop-color="${color.to}" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="#090d16" />
    <rect x="14" y="14" width="100" height="100" rx="28" fill="url(#compGrad)" stroke="${color.accent}" stroke-width="2" stroke-opacity="0.4" />
    <!-- Building/Corporate Symbol -->
    <rect x="38" y="32" width="52" height="42" rx="8" fill="#ffffff" fill-opacity="0.12" stroke="${color.glow}" stroke-width="1.5" />
    <circle cx="52" cy="46" r="4" fill="${color.accent}" />
    <circle cx="76" cy="46" r="4" fill="${color.accent}" />
    <circle cx="64" cy="58" r="4" fill="${color.accent}" />
    <!-- Company Initials Pill Badge -->
    <rect x="24" y="82" width="80" height="28" rx="14" fill="${color.badgeBg}" stroke="${color.accent}" stroke-width="2" />
    <text x="64" y="101" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
