import React from 'react';

export function Table({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0B0B0B] ${className}`}
    >
      <table className="w-full border-collapse text-left text-xs text-[#A7A39B]">
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <thead className="border-b border-white/[0.07] bg-[#111111] text-[10px] font-mono uppercase tracking-[0.15em] text-[#77736C]">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3.5 font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

export function TableBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <tbody className="divide-y divide-white/[0.05]">
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-white/[0.025] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3.5 align-middle text-[#A7A39B] ${className}`}
    >
      {children}
    </td>
  );
}