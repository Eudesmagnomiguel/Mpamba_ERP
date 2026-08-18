import { z } from "zod";

export const SignUpDTO = z.object({
  module: z.string().min(1, "Selecione um plano"),
  companyName: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres"),
  nif: z.string().min(5, "NIF inválido"),
  phone: z.string().min(9, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  address: z.string().min(5, "Endereço inválido"),
  fullName: z.string().min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  adminEmail: z.string().email("Email de administrador inválido"),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha inválida"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos e condições",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

export type SignUpDTOType = z.infer<typeof SignUpDTO>;
