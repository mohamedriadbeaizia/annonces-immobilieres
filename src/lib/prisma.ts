// Import depuis le dossier généré, PAS depuis "@prisma/client" (Prisma 7).
// Chemin relatif plutôt que "@/..." : ce fichier est aussi chargé par le seed (tsx)
// et par la CLI Better Auth, qui ne résolvent pas toujours l'alias.
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // DATABASE_URL déjà validée par env.ts : plus besoin de vérifier qu'elle existe.
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter, log: ["query"] });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// En dev, le rechargement à chaud recrée les modules : on réutilise le même client
// pour ne pas ouvrir un nouveau pool de connexions à chaque sauvegarde.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   

