"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Building2, Users, ArrowRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Button from "@/components/common/forms/Button";
import { useAuthStore } from "@/store/auth.store";
import { useCompleteOnboarding } from "@/hooks/useAuth";

const STEPS = ["Bem-vindo", "A sua empresa", "Convide a equipa"] as const;

export default function OnboardingModal() {
    const { user, updateUser } = useAuthStore();
    const router = useRouter();
    const completeOnboardingMutation = useCompleteOnboarding();
    const [step, setStep] = useState(0);

    const finish = async () => {
        try {
            const result = await completeOnboardingMutation.mutateAsync();
            updateUser({ onboardingCompletedAt: result.onboardingCompletedAt });
        } catch {
            // Mesmo que a chamada falhe, não bloqueamos o utilizador — tenta-se
            // marcar novamente no próximo carregamento (onboardingCompletedAt
            // continua null, por isso o modal reaparece).
            updateUser({ onboardingCompletedAt: new Date().toISOString() });
        }
    };

    const goToUsers = () => {
        finish();
        router.push("/core/users");
    };

    return (
        <Dialog open onOpenChange={() => {}}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-md p-0 overflow-hidden rounded-sm border-none shadow-2xl"
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                {/* Progress */}
                <div className="flex gap-1.5 px-8 pt-6">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={i <= step ? "h-1 flex-1 rounded-full bg-primary" : "h-1 flex-1 rounded-full bg-muted"}
                        />
                    ))}
                </div>

                <div className="p-8 pt-6">
                    {step === 0 && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Sparkles size={22} />
                            </div>
                            <div>
                                <DialogTitle asChild>
                                    <h2 className="text-xl font-heading font-black text-foreground tracking-tight">
                                        Bem-vindo, {user?.name?.split(" ")[0] ?? "utilizador"}!
                                    </h2>
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    Vamos preparar a sua conta em poucos passos. Isto leva menos de um minuto.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <DialogTitle asChild>
                                    <h2 className="text-xl font-heading font-black text-foreground tracking-tight">
                                        A sua empresa
                                    </h2>
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    Está a trabalhar em nome de <strong className="text-foreground">{user?.organization?.name ?? "—"}</strong>.
                                    Pode completar o logótipo e os restantes dados a qualquer momento em Definições.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Users size={22} />
                            </div>
                            <div>
                                <DialogTitle asChild>
                                    <h2 className="text-xl font-heading font-black text-foreground tracking-tight">
                                        Convide a sua equipa
                                    </h2>
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    Pode adicionar colegas agora, com o papel certo para cada um, ou fazer isso mais tarde.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-8">
                        {step < STEPS.length - 1 ? (
                            <>
                                <button
                                    onClick={finish}
                                    className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                                >
                                    Saltar
                                </button>
                                <Button fullWidth={false} className="px-6" onClick={() => setStep((s) => s + 1)}>
                                    Continuar
                                    <ArrowRight size={14} className="ml-2" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    fullWidth={false}
                                    variant="outline"
                                    className="px-6 bg-primary border-2 border-primary text-white hover:bg-primary-hover"
                                    onClick={goToUsers}
                                >
                                    Convidar agora
                                </Button>
                                <Button
                                    fullWidth={false}
                                    className="px-6"
                                    isLoading={completeOnboardingMutation.isPending}
                                    onClick={finish}
                                >
                                    Concluir
                                    <Check size={14} className="ml-2" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
