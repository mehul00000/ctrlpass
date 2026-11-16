"use client";

import React from "react";
import { CreditCard, Lock, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  FaPaypal as FaPaypalRaw,
  FaApple as FaAppleRaw,
} from "react-icons/fa";
import { FcGoogle as FcGoogleRaw } from "react-icons/fc";

const FaPaypal =
  FaPaypalRaw as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const FaApple =
  FaAppleRaw as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
const FcGoogle =
  FcGoogleRaw as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

export default function RuixenPaymentCard() {
  return (
    <div className="flex w-full items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0B0B0B] text-[#F5F5F2] shadow-2xl shadow-black/40">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D6B47A]/70 to-transparent" />

        <CardContent className="space-y-6 p-6 sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-[#77736C]">
                Secure checkout
              </span>

              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-[#F5F5F2]">
                Payment method
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.06] text-[#D6B47A]">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          {/* Payment Options */}
          <div className="grid grid-cols-3 gap-2.5">
            <Button
              variant="outline"
              className="h-12 gap-2 rounded-xl border-white/[0.08] bg-[#111111] px-2 text-[#F5F5F2] hover:border-[#D6B47A]/35 hover:bg-[#151515]"
            >
              <FaPaypal className="h-4 w-4" />
              <span className="text-xs">PayPal</span>
            </Button>

            <Button
              variant="outline"
              className="h-12 gap-2 rounded-xl border-white/[0.08] bg-[#111111] px-2 text-[#F5F5F2] hover:border-[#D6B47A]/35 hover:bg-[#151515]"
            >
              <FaApple className="h-4 w-4" />
              <span className="text-xs">Pay</span>
            </Button>

            <Button
              variant="outline"
              className="h-12 gap-2 rounded-xl border-white/[0.08] bg-[#111111] px-2 text-[#F5F5F2] hover:border-[#D6B47A]/35 hover:bg-[#151515]"
            >
              <FcGoogle className="h-5 w-5" />
              <span className="text-xs">Pay</span>
            </Button>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.07]" />

            <span className="whitespace-nowrap font-mono text-[8px] font-medium uppercase tracking-[0.12em] text-[#55524D]">
              or pay using card
            </span>

            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          {/* Credit Card Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="cardholder-name"
                className="text-[#77736C]"
              >
                Card holder full name
              </Label>

              <Input
                id="cardholder-name"
                name="cardholderName"
                placeholder="Enter your full name"
                className="h-11 rounded-xl border-white/[0.08] bg-[#111111] text-[#F5F5F2] placeholder:text-[#55524D] focus:border-[#D6B47A]/50 focus:ring-[#D6B47A]/10"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="card-number"
                className="text-[#77736C]"
              >
                Card number
              </Label>

              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77736C]" />

                <Input
                  id="card-number"
                  name="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  className="h-11 rounded-xl border-white/[0.08] bg-[#111111] pl-10 text-[#F5F5F2] placeholder:text-[#55524D] focus:border-[#D6B47A]/50 focus:ring-[#D6B47A]/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label
                  htmlFor="expiry"
                  className="text-[#77736C]"
                >
                  Expiry date
                </Label>

                <Input
                  id="expiry"
                  name="expiryDate"
                  placeholder="MM/YY"
                  className="h-11 rounded-xl border-white/[0.08] bg-[#111111] text-[#F5F5F2] placeholder:text-[#55524D] focus:border-[#D6B47A]/50 focus:ring-[#D6B47A]/10"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="cvv"
                  className="text-[#77736C]"
                >
                  CVV
                </Label>

                <Input
                  id="cvv"
                  name="cvv"
                  placeholder="CVV"
                  inputMode="numeric"
                  type="password"
                  className="h-11 rounded-xl border-white/[0.08] bg-[#111111] text-[#F5F5F2] placeholder:text-[#55524D] focus:border-[#D6B47A]/50 focus:ring-[#D6B47A]/10"
                />
              </div>
            </div>
          </div>

          {/* Checkout */}
          <Button
            className="h-12 w-full rounded-xl border border-[#D6B47A]/30 bg-[#D6B47A] font-semibold text-[#050505] shadow-lg shadow-[#D6B47A]/5 hover:bg-[#E2C58F]"
            size="lg"
          >
            <WalletCards className="mr-2 h-4 w-4" />
            Checkout
          </Button>

          <div className="flex items-center justify-center gap-2 text-[#55524D]">
            <Lock className="h-3 w-3" />

            <span className="font-mono text-[8px] uppercase tracking-[0.12em]">
              Secure payment
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}