/**
 * Inline SVG brand logos for Bangladeshi MFS and Bank Transfer.
 * No external dependencies — renders correctly everywhere.
 */

export function BkashLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#E2136E" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="13" fontWeight="800" fontFamily="Arial, sans-serif"
        letterSpacing="-0.5">bKash</text>
    </svg>
  );
}

export function NagadLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#F4801A" />
      {/* Stylised leaf / flame mark */}
      <ellipse cx="24" cy="19" rx="5" ry="8" fill="white" fillOpacity="0.25" transform="rotate(-15 24 19)" />
      <text x="50%" y="72%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="11" fontWeight="800" fontFamily="Arial, sans-serif"
        letterSpacing="0.3">nagad</text>
    </svg>
  );
}

export function RocketLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#8B44AC" />
      {/* Simple rocket silhouette */}
      <path d="M24 10 C24 10 18 18 18 26 L24 30 L30 26 C30 18 24 10 24 10Z"
        fill="white" fillOpacity="0.9" />
      <circle cx="24" cy="26" r="3" fill="#8B44AC" />
      <path d="M18 28 L15 34 L20 31Z" fill="white" fillOpacity="0.7" />
      <path d="M30 28 L33 34 L28 31Z" fill="white" fillOpacity="0.7" />
      <text x="50%" y="88%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">
        Rocket
      </text>
    </svg>
  );
}

export function BankTransferLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#1D4ED8" />
      {/* Bank building icon */}
      <polygon points="24,10 10,18 38,18" fill="white" fillOpacity="0.9" />
      <rect x="13" y="19" width="4" height="11" rx="1" fill="white" fillOpacity="0.85" />
      <rect x="22" y="19" width="4" height="11" rx="1" fill="white" fillOpacity="0.85" />
      <rect x="31" y="19" width="4" height="11" rx="1" fill="white" fillOpacity="0.85" />
      <rect x="10" y="31" width="28" height="3" rx="1" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
