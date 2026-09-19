import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/*
 * eslint-config-next 15 ships eslintrc-style configs, not flat-config arrays,
 * so they are bridged through FlatCompat. The extensionless
 * "eslint-config-next/core-web-vitals" import that the Next 16 scaffold
 * generates does not resolve against the 15 package.
 */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
