import clsx from 'clsx';

const variants = {
  PENDING:  'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED: 'bg-green-100 text-green-700 border border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border border-red-200',
  PAID:     'bg-indigo-100 text-indigo-700 border border-indigo-200',
  DRAFT:    'bg-gray-100 text-gray-600 border border-gray-200',
};

const dots = {
  PENDING:  'bg-amber-400',
  APPROVED: 'bg-green-400',
  REJECTED: 'bg-red-400',
  PAID:     'bg-indigo-400',
  DRAFT:    'bg-gray-400',
};

export default function StatusBadge({ status }) {
  const key = status?.toUpperCase();
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', variants[key] || variants.DRAFT)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dots[key] || dots.DRAFT)} />
      {status}
    </span>
  );
}
