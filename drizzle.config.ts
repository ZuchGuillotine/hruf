import { defineConfig } from "drizzle-kit";

if (!process.env.AWS_RDS_URL) {
  throw new Error("AWS_RDS_URL must be set for RDS database connection");
}

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.AWS_RDS_URL,
  },
});
