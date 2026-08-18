
"use client";

import React, { useRef, useState, useEffect } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
  isAlphanumeric?: boolean;
}

export default function OTPInput({ 
  value, 
  onChange, 
  disabled = false, 
  length = 6,
  isAlphanumeric = false 
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));

  useEffect(() => {
    const chars = value.split("").slice(0, length);
    const filled = chars.concat(Array(length - chars.length).fill(""));
    setOtp(filled);
  }, [value, length]);

  const handleChange = (index: number, val: string) => {
    const lastChar = val.slice(-1).toUpperCase();
    
    // Regex based on numeric or alphanumeric requirement
    const regex = isAlphanumeric ? /^[A-Z0-9]?$/ : /^[0-9]?$/;
    
    if (regex.test(lastChar)) {
      const newOtp = [...otp];
      newOtp[index] = lastChar;
      setOtp(newOtp);
      onChange(newOtp.join(""));

      if (lastChar && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const rawData = e.clipboardData.getData("text").toUpperCase();
    const filterRegex = isAlphanumeric ? /[^A-Z0-9]/g : /\D/g;
    const pastedData = rawData.replace(filterRegex, "").slice(0, length);
    
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
      inputRefs.current[Math.min(lastFilledIndex + 1, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center">
      {Array(length)
        .fill(null)
        .map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode={isAlphanumeric ? "text" : "numeric"}
            maxLength={1}
            value={otp[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className="h-10 w-8 sm:h-12 sm:w-10 rounded-md border-2 border-slate-200 bg-white text-center text-lg sm:text-xl font-bold text-foreground transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          />
        ))}
    </div>
  );
}
