export function formatCurrency(amountMinor: number, currency: string = 'INR'): string {
  const amount = (amountMinor / 100).toFixed(0);
  return currency === 'INR' ? `₹${amount}` : `${currency} ${amount}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const date = d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date} • ${time}`;
  } catch {
    return dateString;
  }
}

export function formatPaiseCompact(minor: number): string {
  if (minor === 0) return 'FREE';
  const rupees = minor / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${Math.round(rupees)}`;
}

/* shadcn-style class merge (added for beUI registry components) */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
