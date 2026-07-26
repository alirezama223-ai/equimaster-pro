type Props = {
  className?: string;
};

export default function VerifiedBadge({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg ${className}`.trim()}
    >
      ✓ Verified
    </span>
  );
}
