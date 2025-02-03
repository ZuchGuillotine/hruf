
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { supplementReference } from "./schema";

if (!process.env.AWS_RDS_URL) {
  throw new Error("AWS_RDS_URL must be set for supplement reference database");
}

const client = postgres(process.env.AWS_RDS_URL);
export const rdsDb = drizzle(client, { schema: { supplementReference } });
