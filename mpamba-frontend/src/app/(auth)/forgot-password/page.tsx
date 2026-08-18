"use client";

import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import Input from "@/components/common/forms/Input";
import Button from "@/components/common/forms/Button";
import HeaderAuth from "@/components/common/HeaderAuth";
import { ForgotPasswordDTO } from "@/shared/dto/auth.dto";
import { useForgotPassword } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/shared/utils/api-error.utils";

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordDTO>;

export default function ForgotPasswordPage() {
    const forgotPasswordMutation = useForgotPassword();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(ForgotPasswordDTO),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            const result = await forgotPasswordMutation.mutateAsync(data);
            toast.success(result.message);
            reset();
        } catch (error: any) {
            const message = getApiErrorMessage(error, "Ocorreu um erro ao pedir a recuperação de senha.");
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-105 mx-4 rounded-sm">
               
               <HeaderAuth
                    title="Esqueci minha senha"
                    description="Digite seu email para receber o link de recuperação"
                />

                <form className="space-y-3 px-6" onSubmit={handleSubmit(onSubmit)}>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                label="Email"
                                type="email"
                                placeholder="Digite seu email"
                                icon={<Mail size={16} />}
                                error={errors.email?.message}
                                disabled={isSubmitting}
                            />
                        )}
                    />

                    <div className="mb-6" />

                    <Button type="submit" fullWidth isLoading={isSubmitting}>
                        Enviar link
                    </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4 px-6">
                    <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">ou</span>
                    <div className="flex-1 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
                </div>

                {/* Sign In Link */}
                <div className="px-6 pb-6 text-center animate-in fade-in slide-in-from-bottom delay-600 duration-700">
                    <p className="text-slate-600 text-xs font-medium">
                        Já tem acesso?{" "}
                        <Link
                            href="/signin"
                            className="font-black text-primary hover:text-primary/80 transition-colors duration-300 hover:underline"
                        >
                            Faça login
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
