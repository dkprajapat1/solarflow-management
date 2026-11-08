'use client';

export default function StatusBadge({ status }) {
  const normalized = (status || 'SUBMITTED').toUpperCase();

  const configs = {
    SUBMITTED: {
      label: 'Application Submitted',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    BILL_VERIFIED: {
      label: 'Bill Verified',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    COMPANY_REVIEW: {
      label: 'Under Review',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500',
    },
    SITE_SURVEY: {
      label: 'Site Survey Scheduled',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    FINAL_QUOTATION: {
      label: 'Quotation Ready',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
    },
    CUSTOMER_APPROVAL: {
      label: 'Awaiting Customer Approval',
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      dot: 'bg-cyan-500',
    },
    ADVANCE_PAYMENT: {
      label: 'Advance Payment',
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      dot: 'bg-teal-500',
    },
    INSTALLATION_STARTED: {
      label: 'Installation In Progress',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
    },
    INSTALLATION_COMPLETED: {
      label: 'Installation Completed',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    SUBSIDY_PROCESSING: {
      label: 'Subsidy Processing',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      dot: 'bg-sky-500',
    },
    SUBSIDY_CREDITED: {
      label: 'Subsidy Credited',
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      dot: 'bg-green-600',
    },
    INFO_REQUESTED: {
      label: 'Info Requested',
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
    },
    REJECTED: {
      label: 'Application Rejected',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  const current = configs[normalized] || {
    label: normalized.replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}
