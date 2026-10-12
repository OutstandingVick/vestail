import { z } from "zod";

import { CITIZENSHIP_OPTIONS, OWNERSHIP_INTERESTS } from "./early-access.ts";

export const earlyAccessSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  country: z.string().trim().min(1, "Choose your country.").max(100),
  citizenship: z.enum(CITIZENSHIP_OPTIONS, { message: "Choose one option." }),
  interests: z.array(z.enum(OWNERSHIP_INTERESTS)).min(1, "Choose at least one thing.").max(7),
  blockedPurchase: z.string().trim().max(500, "Keep this to 500 characters or fewer.").optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export type EarlyAccessInput = z.input<typeof earlyAccessSchema>;
export type EarlyAccessSignup = z.output<typeof earlyAccessSchema> & { created_at: string };
