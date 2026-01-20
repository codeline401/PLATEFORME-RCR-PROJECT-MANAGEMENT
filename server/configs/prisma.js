import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.poolQueryViaFetch = true; // Enable fetch-based pooling for serverless environments

const adapter = new PrismaNeon({
  // Use PrismaNeon adapter
  connectionString: process.env.DATABASE_URL, // Database connection string from environment variables
});

const globalForPrisma = globalThis; // Ensure a single PrismaClient instance in development

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  }); // Create new PrismaClient if not already existing

if (process.env.NODE_ENV !== "production") {
  // In development, assign to global object
  globalForPrisma.prisma = prisma; // eslint-disable-line no-global-assign
}

export default prisma;
