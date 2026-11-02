import React from 'react';

export default function Badge({ status }) {
  const getBadgeStyle = (st) => {
    switch (String(st).toUpperCase()) {
      case 'AVAILABLE':
      case 'APPROVED':
      case 'VERIFIED':
      case 'RECTIFIED':
      case 'PRESENT':
      case 'SUCCESS':
      case 'FOUND':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'PARTIALLY_OCCUPIED':
      case 'IN_PROGRESS':
      case 'OUTSIDE':
      case 'PENDING':
      case 'INFO':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'FULL':
      case 'REJECTED':
      case 'ABSENT':
      case 'OVERDUE':
      case 'EMERGENCY':
      case 'HIGH':
      case 'LOST':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'MAINTENANCE':
      case 'LEAVE':
      case 'OUTPASS':
      case 'VACATED':
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${getBadgeStyle(status)}`}>
      {status}
    </span>
  );
}
