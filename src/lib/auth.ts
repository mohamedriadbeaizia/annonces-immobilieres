import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Email + mot de passe. Le hachage (scrypt) est fait par Better Auth,
  // stocké dans la table account. On ne hache JAMAIS nous-mêmes.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      role: {
        type: ["USER", "AGENT", "ADMIN"],
        defaultValue: "USER",
        // Le client ne peut PAS fixer son rôle : un POST avec role=ADMIN
        // à l'inscription crée quand même un compte USER.
        input: false,
      },
    },
  },
});
