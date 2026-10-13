import { z } from "zod";

// Les variables d'environnement sont des données entrantes comme les autres :
// string | undefined, sans garantie. On les valide une fois, au chargement,
// et l'application refuse de démarrer avec une configuration invalide.
const MANQUANTE = "variable manquante — copiez-la depuis .env.example";

const Env = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "URL PostgreSQL manquante ou invalide" }),
  BETTER_AUTH_SECRET: z
    .string(MANQUANTE)
    .min(32, "Trop court : générez-le avec `openssl rand -base64 32`"),
  BETTER_AUTH_URL: z.url({ error: "URL manquante ou invalide (ex. http://localhost:3000)" }),
  UPLOAD_DIR: z.string(MANQUANTE).min(1, "Dossier des photos requis (ex. ./uploads)"),
});

const resultat = Env.safeParse(process.env);

if (!resultat.success) {
  const details = resultat.error.issues.map((i) => `  - ${i.path.join(".")} : ${i.message}`).join("\n");
  throw new Error(`Configuration invalide, vérifiez votre .env (voir .env.example) :\n${details}`);
}

export const env = resultat.data;