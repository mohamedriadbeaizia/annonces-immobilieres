// Import depuis le dossier généré, PAS depuis "@prisma/client" (Prisma 7).
// Chemin relatif plutôt que "@/..." : ce fichier est aussi chargé par le seed (tsx)
// et par la CLI Better Auth, qui ne résolvent pas toujours l'alias.
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquante");
  // Prisma 7 : c'est nous qui fournissons la connexion via un driver adapter.
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ["query"] });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// En dev, le rechargement à chaud recrée les modules : on réutilise le même client
// pour ne pas ouvrir un nouveau pool de connexions à chaque sauvegarde.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   

