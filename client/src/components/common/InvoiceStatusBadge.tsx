import React from 'react';

interface InvoiceStatusBadgeProps {
  status: string;
  className?: string;
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toLowerCase();

  // Paid: Background #D1FAE5 (soft green), Text #065F46
  if (normalized === 'paid') {
    return (
      <span
        style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#A7F3D0] ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#065F46]" />
        Paid
      </span>
    );
  }

  // Due / Unpaid / Pending: Background #FEF3C7 (soft amber), Text #92400E
  if (normalized === 'due' || normalized === 'unpaid' || normalized === 'pending') {
    return (
      <span
        style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#FDE68A] ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]" />
        Due
      </span>
    );
  }

  // Overdue: Background #FEE2E2 (soft red), Text #991B1B
  if (normalized === 'overdue') {
    return (
      <span
        style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#FECACA] ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B]" />
        Overdue
      </span>
    );
  }

  // Partially Paid
  if (normalized === 'partially_paid') {
    return (
      <span
        style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#FDE68A] ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]" />
        Partially Paid
      </span>
    );
  }

  // Default / Cancelled
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 ${className}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};
