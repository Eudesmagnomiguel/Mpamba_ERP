"use client";

import React from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import Button from "@/components/common/forms/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SignupSuccessModalProps {
  isOpen: boolean;
  whatsappLink: string;
  onOpenChange?: (open: boolean) => void;
}

export default function SignupSuccessModal({
  isOpen,
  whatsappLink,
  onOpenChange,
}: SignupSuccessModalProps) {
  const handleWhatsAppClick = () => {
    window.open(whatsappLink, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-md rounded-2xl border border-slate-100 bg-white p-0 shadow-xl">
        <div className="flex flex-col items-center px-6 py-8 sm:px-8">
          {/* Icon */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          {/* Header */}
          <DialogHeader className="space-y-2 text-center">
            <DialogTitle className="text-xl sm:text-2xl font-semibold text-slate-900">
              Candidatura submetida
            </DialogTitle>

            <DialogDescription className="text-sm sm:text-base text-slate-500 leading-relaxed">
              A sua organização foi registada com sucesso e está pendente de
              aprovação.
            </DialogDescription>
          </DialogHeader>

          {/* Steps */}
          <div className="mt-8 w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                1
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Entre em contacto com o suporte via WhatsApp para confirmar o
                pagamento.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                2
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Após a confirmação, receberá um e-mail com o código de ativação.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                3
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Utilize o código para ativar a sua plataforma.
              </p>
            </div>
          </div>

          {/* Button */}
          <div className="mt-8 w-full">
            <Button
              onClick={handleWhatsAppClick}
              className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-medium text-white transition-all hover:bg-emerald-600"
              icon={<MessageCircle className="h-5 w-5" />}
            >
              Contactar suporte
            </Button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Resposta média em até 15 minutos
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}