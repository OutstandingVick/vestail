import { z } from "zod";
import { CRYPTO_EXPERIENCE, TESTER_COUNTRIES, TESTER_RELATIONSHIPS } from "./testers.ts";
import { isSolanaPublicKey } from "./solana-address.ts";

const COUNTRY_NAMES = TESTER_COUNTRIES.map(([, name]) => name) as [string, ...string[]];

export const testerApplicationSchema = z.object({
  xHandle: z.string().trim().min(1, "Enter your X handle.").max(50, "Keep your X handle to 50 characters or fewer."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  country: z.enum(COUNTRY_NAMES, { message: "Choose a supported country." }),
  relationship: z.enum(TESTER_RELATIONSHIPS, { message: "Choose citizen or foreigner." }),
  wallet: z.string().trim().refine(isSolanaPublicKey, "Enter a valid Solana wallet address."),
  experience: z.enum(CRYPTO_EXPERIENCE, { message: "Choose your crypto experience." }),
  reason: z.string().trim().max(280, "Keep this to 280 characters or fewer.").optional().default(""),
  telegram: z.string().trim().min(1, "Enter your Telegram username.").max(50, "Keep your Telegram username to 50 characters or fewer."),
  website: z.string().max(0).optional().default(""),
});

export type TesterApplicationInput = z.input<typeof testerApplicationSchema>;
export type TesterApplication = Omit<z.output<typeof testerApplicationSchema>, "website"> & {
  status: "pending";
  created_at: string;
};
