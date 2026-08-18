"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import Input from "@/components/common/forms/Input";
import Button from "@/components/common/forms/Button";
import HeaderAuth from "@/components/common/HeaderAuth";
import { ResetPasswordDTO } from "@/shared/dto/auth.dto";
import { useResetPassword } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/shared/utils/api-error.utils";

const ResetPasswordFormSchema = ResetPasswordDTO.extend({
    confirmPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof ResetPasswordFormSchema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const resetPasswordMutation = useResetPassword();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(ResetPasswordFormSchema),
        defaultValues: {
            token,
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            const result = await resetPasswordMutation.mutateAsync({
                token: data.token,
                password: data.password,
            });
            toast.success(result.message);
            router.push("/signin");
        } catch (error: any) {
            const message = getApiErrorMessage(error, "Não foi possível redefinir a senha.");
            toast.error(message);
        }
    };

    if (!token) {
        return (
            <Card className="w-full max-w-105 mx-4 rounded-sm">
                <HeaderAuth
                    title="Link inválido"
                    description="Este link de recuperação de senha é inválido ou está incompleto."
                />
                <div className="px-6 pb-6 text-center">
                    <Link
                        href="/forgot-password"
                        className="font-black text-primary hover:text-primary/80 transition-colors duration-300 hover:underline text-xs"
                    >
                        Pedir um novo link
                    </Link>
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-105 mx-4 rounded-sm">
            <HeaderAuth
                title="Redefinir senha"
                description="Escolha uma nova senha para a sua conta"
            />

            <form className="space-y-3 px-6" onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Nova senha"
                            type="password"
                            placeholder="Digite a nova senha"
                            icon={<LockKeyhole size={16} />}
                            showPasswordToggle
                            error={errors.password?.message}
                            disabled={isSubmitting}
                        />
                    )}
                />

                <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            label="Confirmar senha"
                            type="password"
                            placeholder="Repita a nova senha"
                            icon={<LockKeyhole size={16} />}
                            showPasswordToggle
                            error={errors.confirmPassword?.message}
                            disabled={isSubmitting}
                        />
                    )}
                />

                <div className="mb-6" />

                <Button type="submit" fullWidth isLoading={isSubmitting}>
                    Redefinir senha
                </Button>
            </form>

            <div className="px-6 pb-6 text-center animate-in fade-in slide-in-from-bottom delay-600 duration-700">
                <p className="text-slate-600 text-xs font-medium">
                    Lembrou-se da senha?{" "}
                    <Link
                        href="/signin"
                        className="font-black text-primary hover:text-primary/80 transition-colors duration-300 hover:underline"
                    >
                        Faça login
                    </Link>
                </p>
            </div>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Suspense
                fallback={
                    <Card className="w-full max-w-105 mx-4 p-20 flex flex-col items-center justify-center gap-4 border-none shadow-sm">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </Card>
                }
            >
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
