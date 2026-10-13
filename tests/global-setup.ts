import "dotenv/config";
import { execSync } from "node:child_process";

// Exécuté UNE fois, au lancement de `npm test`.
export default function setup() {
  const urlTest = process.env.DATABASE_URL_TEST;

  if (!urlTest) {
    throw new Error("DATABASE_URL_TEST manquante — voir .env.example");
  }
  // Garde-fou : les tests vident la base. Si les deux URL étaient égales,
  // `npm test` effacerait les données de développement.
  if (urlTest === process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL_TEST doit être différente de DATABASE_URL");
  }

  // Applique les migrations versionnées sur la base de test (crée les tables si besoin).
  // prisma.config.ts charge le .env, mais dotenv n'écrase jamais une variable déjà définie :
  // c'est bien l'URL de test passée ici qui est utilisée.
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: urlTest },
  });
}