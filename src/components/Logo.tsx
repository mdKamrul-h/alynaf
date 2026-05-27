interface LogoProps {
  size?: number;
}

export default function Logo({ size = 48 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AlyNaf logo"
    >
      <circle cx="50" cy="50" r="48" fill="#0a0a0a" stroke="#333" strokeWidth="2" />
      <path
        d="M28 72V28h12l10 28 10-28h12v44h-10V48l-9 24h-8l-9-24v24H28z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M62 28h10v44H62V28z"
        fill="white"
        opacity="0.7"
      />
    </svg>
  );
}
