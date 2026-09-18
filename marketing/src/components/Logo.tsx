export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#6d4fe8" />
      <rect x="7" y="12.5" width="26" height="15" rx="3" fill="#ffffff" />
      <circle cx="7" cy="20" r="3.6" fill="#6d4fe8" />
      <circle cx="33" cy="20" r="3.6" fill="#6d4fe8" />
      <circle cx="20" cy="16.2" r="1.1" fill="#6d4fe8" />
      <circle cx="20" cy="20" r="1.1" fill="#6d4fe8" />
      <circle cx="20" cy="23.8" r="1.1" fill="#6d4fe8" />
    </svg>
  );
}
