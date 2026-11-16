import React from 'react';
import { Ticket, AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export function LoadingState({
  message = 'Loading experience...',
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.06] text-[#D6B47A]">
        <Ticket className="h-5 w-5 animate-pulse" />
      </div>

      <div className="space-y-1.5">
        <div className="mx-auto h-px w-16 overflow-hidden bg-white/[0.06]">
          <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] bg-[#D6B47A]" />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#77736C]">
          {message}
        </p>
      </div>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Unable to complete this operation.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#D96B6B]/15 bg-[#0B0B0B] px-6 py-16 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D96B6B]/20 bg-[#D96B6B]/[0.06] text-[#D96B6B]">
        <AlertCircle className="h-5 w-5" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-lg font-semibold text-[#F5F5F2]">
          {title}
        </h3>

        <p className="text-sm leading-6 text-[#77736C]">
          {description}
        </p>
      </div>

      {onRetry && (
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}