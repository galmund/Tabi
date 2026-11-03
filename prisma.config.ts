import "dotenv/config";
import { defineConfig } from "prisma/config";

const cliUrl = [process.env["DIRECT_URL"], process.env["DATABASE_URL"]].find(
  (value) => value && value.trim() !== ""
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: cliUrl,
  },
});
