import { z } from "zod";

export const ActivateAccountDTO = z.object({
  email: z.string().email("Email inválido"),
  otp: z.string().length(6, "O código deve ter 6 dígitos"),
});

export type ActivateAccountDTOType = z.infer<typeof ActivateAccountDTO>;
