import "dotenv/config";

// Exécuté avant CHAQUE fichier de test, AVANT ses imports.
// On bascule toute l'application sur la base de test : quand prisma.ts sera chargé
// par un test, env.ts lira déjà l'URL de test.
//
// Volontairement, ce fichier n'importe rien de l'application : les imports sont
// remontés en haut du fichier par JavaScript, et prisma.ts serait alors chargé
// AVANT la ligne ci-dessous, donc connecté à la base de dev.
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;