"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, User, ShieldCheck, Receipt, Boxes, Wallet } from "lucide-react";
import { toast } from "sonner";

import Input from "@/components/common/forms/Input";
import Button from "@/components/common/forms/Button";
import { SignInDTO, SignInDTOType } from "@/shared/dto/auth.dto";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { getHomePath } from "@/shared/utils/auth.utils";
import { getApiErrorMessage } from "@/shared/utils/api-error.utils";
import logoWhite from "@/assets/images/icon/icon4.png";
import signinBanner from "@/assets/images/auth/signin-banner.jpg";

const FEATURES = [
    { icon: Receipt, label: "Faturação e documentos fiscais" },
    { icon: Boxes, label: "Controlo de stock e inventário" },
    { icon: Wallet, label: "Tesouraria e fluxos financeiros" },
];

export default function SignInPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const loginMutation = useLogin();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInDTOType>({
        resolver: zodResolver(SignInDTO),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: SignInDTOType) => {
        try {
            const response = await loginMutation.mutateAsync(data);
            setAuth(response.user, response.accessToken, response.refreshToken);
            toast.success(`Seja bem-vindo ao Mpamba ERP, ${response.user.name}!`);
            router.push(getHomePath(response.user));
        } catch (error: any) {
            const message = getApiErrorMessage(error, "Ocorreu um erro ao tentar entrar.");
            toast.error(message);
            console.error("Login error:", { message, error });
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left — brand panel (hidden on small screens) */}
            <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative z-0 flex-col justify-between text-white p-12 overflow-hidden">
                <Image
                    src={signinBanner}
                    alt=""
                    fill
                    priority
                    sizes="42vw"
                    className="object-cover object-top -z-20"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/50 to-black/10 pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10">
                    <Image src={logoWhite} alt="Mpamba" width={132} height={34} style={{ height: "auto" }} priority />
                </div>

                {/* Headline + feature list */}
                <div className="relative z-10 space-y-8">
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-warm">
                            Plataforma de Gestão
                        </span>
                        <h1 className="text-3xl font-heading font-black tracking-tight leading-tight text-wrap-balance">
                            A gestão financeira da sua empresa, num único lugar.
                        </h1>
                        <p className="text-white/70 text-sm font-medium max-w-md">
                            Faturação, stock e tesouraria integrados — desenhado para PMEs em Angola.
                        </p>
                    </div>

                    <div className="h-px w-full bg-white/15" />

                    <ul className="space-y-3">
                        {FEATURES.map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-white/85 font-medium">
                                <f.icon size={16} className="text-accent-warm shrink-0" />
                                {f.label}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer trust line */}
                <div className="relative z-10 flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    Dados protegidos
                </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-2xl font-heading font-black text-foreground tracking-tight">
                            Bem-vindo de volta
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1.5">
                            Entre com as suas credenciais para continuar.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Email ou Nome de Utilizador"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Digite seu email ou nome de utilizador"
                                    icon={<User size={16} />}
                                    error={errors.email?.message}
                                    disabled={loginMutation.isPending}
                                />
                            )}
                        />

                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="Senha"
                                    type="password"
                                    placeholder="Digite sua senha"
                                    icon={<LockKeyhole size={16} />}
                                    showPasswordToggle
                                    error={errors.password?.message}
                                    disabled={loginMutation.isPending}
                                />
                            )}
                        />

                        <div className="flex items-center justify-end pt-1 text-xs font-medium text-slate-600">
                            <Link
                                href="/forgot-password"
                                className="font-black text-primary transition-colors duration-300 hover:text-primary-hover hover:underline"
                            >
                                Esqueci minha senha
                            </Link>
                        </div>

                        <Button type="submit" fullWidth isLoading={loginMutation.isPending} className="mt-2">
                            Entrar
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600 text-xs font-medium">
                            Ainda não tem conta?{" "}
                            <Link
                                href="/signup"
                                className="font-black text-primary hover:text-primary-hover transition-colors duration-300 hover:underline"
                            >
                                Registe sua empresa
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
