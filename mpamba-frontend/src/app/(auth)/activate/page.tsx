
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import Button from "@/components/common/forms/Button";
import HeaderAuth from "@/components/common/HeaderAuth";
import OTPInput from "@/components/common/forms/OTPInput";
import { ActivateWithCodeDTO, ActivateWithCodeDTOType } from "@/shared/dto/auth.dto";
import { useActivateWithCode } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/shared/utils/api-error.utils";
import { toast } from "sonner";
import { KeyRound, Loader2, Timer } from "lucide-react";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');
  const initialCode = searchParams.get('code');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos em segundos
  const activateMutation = useActivateWithCode();

  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<ActivateWithCodeDTOType>({
    resolver: zodResolver(ActivateWithCodeDTO),
    defaultValues: {
      organizationId: orgId || '',
      code: initialCode || '',
    }
  });

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (orgId) {
      setValue('organizationId', orgId);
    }
    if (initialCode) {
      setValue('code', initialCode);
    }
  }, [orgId, initialCode, setValue]);

  const onSubmit = async (data: ActivateWithCodeDTOType) => {
    try {
      setIsLoading(true);
      await activateMutation.mutateAsync(data);
      toast.success("Sistema ativado com sucesso! Seja bem-vindo ao Mpamba.");
      router.push('/signin');
    } catch (error: any) {
      const message = getApiErrorMessage(error, "Código de ativação inválido ou já utilizado.");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-105 mx-4 overflow-hidden border-none shadow-sm">
      <HeaderAuth 
        title="Ativar Meu Sistema"
        description="Sua subscrição foi aprovada! Insira o código."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-8 space-y-6">
        <input type="hidden" {...register("organizationId")} />
        
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              Código de Ativação
            </label>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-full border border-slate-100">
               <Timer size={12} className={timeLeft < 300 ? "text-red-500 animate-pulse" : "text-slate-400"} />
               <span className={`text-[11px] font-mono font-bold ${timeLeft < 300 ? "text-red-500" : "text-slate-500"}`}>
                 Expira em: {formatTime(timeLeft)}
               </span>
            </div>
          </div>
          
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <OTPInput 
                value={field.value} 
                onChange={field.onChange}
                length={8}
                isAlphanumeric={true}
                disabled={isLoading}
              />
            )}
          />

          {errors.code && (
            <p className="text-[10px] text-red-500 text-center font-bold uppercase">
              {errors.code.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            fullWidth
            className="h-12 text-sm font-bold shadow-md shadow-primary/10"
            isLoading={isLoading}
            icon={<KeyRound className="w-4 h-4" />}
          >
            Ativar Sistema
          </Button>
        </div>

        <div className="text-center space-y-3 pt-4 border-t border-slate-50 mt-2">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-4">
            Ao ativar, todos os módulos contratados ficarão disponíveis imediatamente na sua conta.
          </p>
          <div className="pt-1">
            <Link 
              href="/signin" 
              className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors duration-300 hover:underline uppercase tracking-widest"
            >
              Voltar para o Login
            </Link>
          </div>
        </div>
      </form>
    </Card>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col py-6">
      <Suspense fallback={
        <Card className="w-full max-w-105 mx-4 p-20 flex flex-col items-center justify-center gap-4 border-none shadow-sm">
           <Loader2 className="w-8 h-8 text-primary animate-spin" />
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando...</p>
        </Card>
      }>
        <ActivateForm />
      </Suspense>
      
      <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Problemas? <a href="#" className="text-primary hover:underline">Suporte técnico</a>
      </p>
    </div>
  );
}
