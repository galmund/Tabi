import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    // Prisma's generated client is machine-written; nothing to lint there.
    ignores: ["src/generated/**", ".next/**", "node_modules/**"],
  },
];

export default config;
