import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import Input from "@/components/common/forms/Input";
import { SignUpDTOType } from "@/shared/dto/signup.dto";

export default function OrganizationStep() {
  const { control, formState: { errors } } = useFormContext<SignUpDTOType>();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name="companyName"
          control={control}
          render={({ field }) => (
            <Input
              label="Nome da Empresa"
              placeholder="Digite o nome da empresa"
              type="text"
              {...field}
              error={errors.companyName?.message}
            />
          )}
        />
        <Controller
          name="nif"
          control={control}
          render={({ field }) => (
            <Input
              label="NIF (Contribuinte)"
              placeholder="Digite o NIF"
              type="text"
              {...field}
              error={errors.nif?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input
              label="Telefone"
              placeholder="Digite o telefone"
              type="tel"
              {...field}
              error={errors.phone?.message}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              label="Email Comercial"
              placeholder="Digite o email comercial"
              type="email"
              {...field}
              error={errors.email?.message}
            />
          )}
        />
      </div>

      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <Input
            label="Endereço Fiscal"
            placeholder="Digite o endereço fiscal"
            type="text"
            {...field}
            error={errors.address?.message}
          />
        )}
      />
    </div>
  );
}
