// Prisma configuration for GEO Tracker
import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import * as path from "path";

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

config({ path: path.resolve(process.cwd(), envFile) });

// Fallback to .env if environment-specific file doesn't exist
if (!process.env.DATABASE_URL) {
  config();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
