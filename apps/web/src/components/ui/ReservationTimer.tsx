import React, { useEffect, useState } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface ReservationTimerProps {
  expiresAt?: string | null;
  initialMinutes?: number;
  onExpire?: () => void;
}

export default function ReservationTimer({
  expiresAt,
  initialMinutes = 10,
  onExpire,
}: ReservationTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (expiresAt) {
      const diff = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000,
      );

      return Math.max(0, diff);
    }

    return initialMinutes * 60;
  });

  useEffect(() => {
    if (expiresAt) {
      const diff = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000,
      );

      setSecondsLeft(Math.max(0, diff));
    }
  }, [expiresAt]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 180;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
        isUrgent
          ? 'animate-pulse border-[#D96B6B]/30 bg-[#D96B6B]/[0.07] text-[#D96B6B]'
          : 'border-[#D6B47A]/20 bg-[#D6B47A]/[0.06] text-[#D6B47A]'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Timer className="h-3.5 w-3.5 shrink-0" />
      )}

      <span>
        Hold Active:{' '}
        <strong className="font-bold">
          {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </strong>
      </span>
    </div>
  );
}