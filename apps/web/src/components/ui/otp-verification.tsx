'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OTPVerificationProps {
    title?: string;
    subtitle?: string;
    length?: number;
    onComplete?: (code: string) => void;
    onResend?: () => void;
    resendCooldown?: number;
    className?: string;
    autoFocus?: boolean;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
    title = "Verify Identity",
    subtitle = "Enter the 4-digit code sent to your device.",
    length = 4,
    onComplete,
    onResend,
    resendCooldown = 30,
    className,
    autoFocus = true
}) => {
    const [code, setCode] = useState<string[]>(Array(length).fill(''));
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        const fullCode = newCode.join('');
        if (fullCode.length === length && onComplete) {
            onComplete(fullCode);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = () => {
        if (cooldown > 0) return;
        if (onResend) {
            onResend();
        }
        setCooldown(resendCooldown);
        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div className={cn("w-full h-[600px] flex flex-col items-center justify-center bg-[#09090b] text-white", className)}>
            <div className="w-full max-w-md bg-[#18181b] p-8 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400">
                    <Smartphone size={32} />
                </div>

                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <p className="text-neutral-400 mb-8 text-sm">{subtitle}</p>

                <div className="flex gap-4 justify-center mb-8">
                    {code.map((digit, idx) => (
                        <motion.input
                            key={idx}
                            ref={el => {
                                if (el) inputRefs.current[idx] = el;
                                if (idx === 0 && autoFocus) el?.focus();
                            }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className={cn(
                                "w-14 h-16 bg-black border rounded-xl text-center text-2xl font-bold focus:outline-none transition-all",
                                digit
                                    ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-white"
                                    : "border-white/10 text-neutral-500 focus:border-indigo-500/50"
                            )}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            whileFocus={{ scale: 1.05, y: -2 }}
                        />
                    ))}
                </div>

                <button
                    onClick={() => onComplete?.(code.join(''))}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl mb-4 hover:bg-neutral-200 transition-colors"
                >
                    Verify Code
                </button>

                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                    <span>Didn&apos;t receive code?</span>
                    <button
                        onClick={handleResend}
                        disabled={cooldown > 0}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend'}
                    </button>
                </div>
            </div>
        </div>
    );
};
