import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import Input from "@/components/common/forms/Input";
import { SignUpDTOType } from "@/shared/dto/signup.dto";

export default function AdminStep() {
  const { control, formState: { errors } } = useFormContext<SignUpDTOType>();

  return (
    <div className="space-y-4">
      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <Input
            label="Nome Completo"
            placeholder="Digite seu nome completo"
            type="text"
            {...field}
            error={errors.fullName?.message}
          />
        )}
      />
      <Controller
        name="adminEmail"
        control={control}
        render={({ field }) => (
          <Input
            label="Email"
            placeholder="Digite seu email de acesso"
            type="email"
            {...field}
            error={errors.adminEmail?.message}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              label="Senha"
              placeholder="Digite sua senha"
              type="password"
              {...field}
              error={errors.password?.message}
              showPasswordToggle
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <Input
              label="Confirmar Senha"
              placeholder="Confirme sua senha"
              type="password"
              {...field}
              error={errors.confirmPassword?.message}
              showPasswordToggle
            />
          )}
        />
      </div>

      <Controller
        name="acceptTerms"
        control={control}
        render={({ field }) => (
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={field.value}
              onChange={field.onChange}
              className="mt-1 h-4 w-4 rounded border-2 border-gray-200 accent-primary"
            />
            <div>
              <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed">
                Eu li e aceito os <span className="font-semibold text-primary">Termos de Uso</span> e a{" "}
                <span className="font-semibold text-primary">Política de Privacidade</span> da Mpamba.
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>●</span> {errors.acceptTerms.message}
                </p>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
