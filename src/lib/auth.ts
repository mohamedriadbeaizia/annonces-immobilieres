import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { env } from "./env";

export const auth = betterAuth({
    // Explicite plutôt que lu implicitement par la bibliothèque : valeurs déjà validées.
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
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
  // Permet aux Server Actions de poser le cookie de session.
  // Doit rester le DERNIER plugin de la liste.
  plugins: [nextCookies()],
});
