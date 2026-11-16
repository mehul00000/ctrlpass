interface StatusBadgeProps {
  status: string;
}

const SUCCESS_STATUSES = [
  'ACTIVE',
  'CONFIRMED',
  'PUBLISHED',
  'VERIFIED',
  'COMPLETED',
  'SUCCESS',
];

const WARNING_STATUSES = [
  'PENDING',
  'DRAFT',
  'RESERVED',
  'IN_REVIEW',
];

const ERROR_STATUSES = [
  'REJECTED',
  'CANCELLED',
  'FAILED',
  'EXPIRED',
  'SUSPENDED',
  'REVOKED',
];

const ACCENT_STATUSES = ['PAID', 'GATE_OPEN'];

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();

  let badgeClass =
    'border-white/[0.10] bg-white/[0.04] text-[#A7A39B]';

  if (SUCCESS_STATUSES.includes(normalizedStatus)) {
    badgeClass =
      'border-[#7FBF9A]/20 bg-[#7FBF9A]/[0.07] text-[#7FBF9A]';
  } else if (WARNING_STATUSES.includes(normalizedStatus)) {
    badgeClass =
      'border-[#D6B47A]/20 bg-[#D6B47A]/[0.07] text-[#D6B47A]';
  } else if (ERROR_STATUSES.includes(normalizedStatus)) {
    badgeClass =
      'border-[#D96B6B]/20 bg-[#D96B6B]/[0.07] text-[#D96B6B]';
  } else if (ACCENT_STATUSES.includes(normalizedStatus)) {
    badgeClass =
      'border-[#D6B47A]/30 bg-[#D6B47A]/[0.10] text-[#D6B47A]';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider ${badgeClass}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}