import { z } from "zod";

export const testerApplicationSchema = z.object({
  xHandle: z.string().trim().min(1, "Enter your X handle.").max(50, "Keep your X handle to 50 characters or fewer."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
});
