
import { Loader2 } from "lucide-react";
import { usePlans } from "@/hooks/usePlan";
import Select from "@/components/common/forms/Select";
import { SignUpDTOType } from "@/shared/dto/signup.dto";
import { Controller, useFormContext } from "react-hook-form";
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function ModuleStep() {
  const { control, formState: { errors } } = useFormContext<SignUpDTOType>();
  const { data: plansData, isLoading, isError, error } = usePlans();
  
  console.log("Plans Query State:", { plansData, isLoading, isError, error });

  if (isError) {
    console.error("Error loading plans:", error);
  }

  return (
    <Controller
      name="module"
      control={control}
      render={({ field }) => (
        <div className="space-y-1">
          <Select label="Selecione um plano" value={field.value} onValueChange={field.onChange}>
            <SelectTrigger 
              className="w-full rounded-sm border-2 border-gray-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-foreground hover:border-gray-300 focus:border-gray-300 focus:bg-white focus:outline-none [&:focus-visible]:ring-0 [&:focus-visible]:border-gray-300 flex items-center justify-between"
            >
              <SelectValue placeholder={isLoading ? "Carregando planos..." : "Escolha um plano para começar"} />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(plansData?.data) && plansData.data.map((plan: any) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price > 0 ? `Kz ${plan.price.toLocaleString()}` : 'Grátis'}
                </SelectItem>
              ))}
              
              {!isLoading && (!plansData?.data || plansData.data.length === 0) && (
                <div className="p-4 text-center text-sm text-slate-500">
                  Nenhum plano disponível no momento.
                </div>
              )}
            </SelectContent>
          </Select>
          {errors.module && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <span>●</span> {errors.module.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
