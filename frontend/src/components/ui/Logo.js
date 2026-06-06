export default function Logo({ className = "text-lg" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4 8h6V4H4v4zm10 0h6V4h-6v4zM4 14h6v-6H4v6zm10 0h6v-6h-6v6zM4 20h6v-6H4v6zm10 0h6v-6h-6v6z" opacity="0.3" />
      <path d="M7 6h2v2H7V6zm8 0h2v2h-2V6zM7 12h2v2H7v-2zm8 0h2v2h-2v-2zM7 18h2v2H7v-2zm8 0h2v2h-2v-2z" />
    </svg>
  );
}
