
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/common/forms/Button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import HeaderAuth from "@/components/common/HeaderAuth";
import AdminStep from "@/components/layout/auth/AdminStep";
import ModuleStep from "@/components/layout/auth/ModuleStep";
import { SignUpDTO, SignUpDTOType } from "@/shared/dto/signup.dto";
import ProgressIndicator from "@/components/common/ProgressIndicator";
import OrganizationStep from "@/components/layout/auth/OrganizationStep";
import SignupSuccessModal from "@/components/layout/auth/SignupSuccessModal";
import { useRegister } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/shared/utils/api-error.utils";
import { toast } from "sonner";

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState<'module'|'organization'|'admin'>('module');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const registerMutation = useRegister();

  const methods = useForm<SignUpDTOType>({
    resolver: zodResolver(SignUpDTO),
    mode: "onBlur",
    defaultValues: {
      module: '',
      companyName: '',
      nif: '',
      phone: '',
      email: '',
      address: '',
      fullName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const steps: Array<'module'|'organization'|'admin'> = ['module', 'organization', 'admin'];
  const currentStepIndex = steps.indexOf(step);

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: Array<keyof SignUpDTOType> = [];
    
    if (step === 'module') {
      fieldsToValidate = ['module'];
    } else if (step === 'organization') {
      fieldsToValidate = ['companyName', 'nif', 'phone', 'email', 'address'];
    } else if (step === 'admin') {
      fieldsToValidate = ['fullName', 'adminEmail', 'password', 'confirmPassword', 'acceptTerms'];
    }

    const isValid = await methods.trigger(fieldsToValidate);
    
    if (isValid && currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    }
  };

  const handleSubmit = async (data: SignUpDTOType) => {
    try {
      setIsLoading(true);
      
      const payload = {
        orgName: data.companyName,
        nif: data.nif,
        adminName: data.fullName,
        adminEmail: data.adminEmail,
        password: data.password,
        address: data.address,
        phone: data.phone,
        orgEmail: data.email,
        planId: data.module,
      };

      const result = (await registerMutation.mutateAsync(payload as any)) as any;
      
      if (result.data?.whatsappLink) {
        setWhatsappLink(result.data.whatsappLink);
        setShowSuccessModal(true);
      } else {
        router.push('/signin');
      }
    } catch (error: any) {
      const message = getApiErrorMessage(error, "Ocorreu um erro ao tentar criar a conta.");
      toast.error(message);
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHandler = async () => {
    if (currentStepIndex < steps.length - 1) {
      await nextStep();
    } else {
      await methods.handleSubmit(handleSubmit)();
    }
  };

  return (
    <div className="min-h-screen px-6 flex items-center flex-col justify-center bg-gray-50">
        <Card className="w-full max-w-105 mx-4 rounded-sm ">
            <HeaderAuth 
                title="Crie sua conta Mpamba"
                description="Siga os passos para configurar sua empresa"
            />

            <ProgressIndicator current={step} />

            <FormProvider {...methods}>
              <form className="space-y-4 px-6">
                {step === 'module' && <ModuleStep />}
                {step === 'organization' && <OrganizationStep />}
                {step === 'admin' && <AdminStep />}

                <div className="flex gap-2 pt-2 pb-6">
                    {currentStepIndex > 0 && (
                        <Button
                            type="button"
                            onClick={prevStep}
                            className="flex-1 bg-gray-200! text-gray-700! hover:bg-gray-300! shadow-none!"
                            icon={<ArrowLeft className="w-4 h-4" />}
                        >
                            Anterior
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={onSubmitHandler}
                        disabled={isLoading}
                        isLoading={isLoading}
                        loadingText={currentStepIndex < steps.length - 1 ? "Continuando..." : "Registando..."}
                        className={currentStepIndex === 0 ? "w-full" : "flex-1"}
                        icon={currentStepIndex === steps.length - 1 && !isLoading ? <CheckCircle className="w-4 h-4" /> : undefined}
                        iconPosition="end"
                    >
                        {currentStepIndex === steps.length - 1 ? "Finalizar Registo" : "Próximo"}
                    </Button>
                </div>
              </form>
            </FormProvider>
        </Card>

        <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm font-medium">
                Já possui uma organização?{' '}
                <Link
                    href="/signin"
                    className="p-0 h-auto font-bold text-primary hover:text-primary/80"
                >
                    Faça Login aqui
                </Link>
            </p>
        </div>

        <SignupSuccessModal 
          isOpen={showSuccessModal} 
          whatsappLink={whatsappLink} 
          onOpenChange={setShowSuccessModal}
        />
    </div>
  );
}