import { EARLY_ACCESS_COUNTRIES } from "./early-access.ts";

export const TESTER_COUNTRIES = EARLY_ACCESS_COUNTRIES;
export const TESTER_RELATIONSHIPS = ["Citizen", "Foreigner"] as const;
export const CRYPTO_EXPERIENCE = ["New", "Some", "Experienced"] as const;

export const TESTER_STEPS = [
  ["Pick your country", "Citizen or foreigner"],
  ["See what you can own", "Every verdict, with its source"],
  ["Make a tiny real buy", "With your own wallet"],
  ["Tell us what broke", "Honest feedback only"],
] as const;
