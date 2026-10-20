import { z } from "zod";
import { TESTER_COUNTRIES, TESTER_RELATIONSHIPS } from "./testers.ts";

const COUNTRY_NAMES = TESTER_COUNTRIES.map(([, name]) => name) as [string, ...string[]];

export const testerApplicationSchema = z.object({
  xHandle: z.string().trim().min(1, "Enter your X handle.").max(50, "Keep your X handle to 50 characters or fewer."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  country: z.enum(COUNTRY_NAMES, { message: "Choose a supported country." }),
  relationship: z.enum(TESTER_RELATIONSHIPS, { message: "Choose citizen or foreigner." }),
});
