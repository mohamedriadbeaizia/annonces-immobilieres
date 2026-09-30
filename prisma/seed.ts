// Doit rester le PREMIER import : charge .env avant que prisma.ts lise DATABASE_URL.
import "dotenv/config";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const MOT_DE_PASSE: string = process.env.SEED_PASSWORD ?? "";
if (!MOT_DE_PASSE) throw new Error("SEED_PASSWORD manquant — voir .env.example");

// Nombre d'annonces réglable pour mesurer le N+1 : NB_ANNONCES=30 npm run db:seed
const NB_ANNONCES = Number(process.env.NB_ANNONCES ?? 12);

const COMPTES = [
  { name: "Admin Immo", email: "admin@immo.test", role: "ADMIN" },
  { name: "Alice Agent", email: "alice@immo.test", role: "AGENT" },
  { name: "Bruno Agent", email: "bruno@immo.test", role: "AGENT" },
  { name: "Claire Martin", email: "claire@immo.test", role: "USER" },
  { name: "David Leroy", email: "david@immo.test", role: "USER" },
] as const;

const BIENS = ["Appartement T2", "Appartement T3", "Maison 4 pièces", "Studio", "Loft", "Maison de ville"];
const VILLES = ["Le Havre", "Rouen", "Caen", "Honfleur", "Étretat", "Fécamp"];
const JOUR = 24 * 60 * 60 * 1000;

async function vider() {
  // Enfants avant parents, à cause des clés étrangères.
  await prisma.favori.deleteMany();
  await prisma.question.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.annonce.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
}

async function creerComptes() {
  const ids: Record<string, string> = {};

  for (const compte of COMPTES) {
    // Via l'API Better Auth : le mot de passe est haché (scrypt)
    // et stocké dans la table account. Jamais prisma.user.create ici.
    const { user } = await auth.api.signUpEmail({
      body: { name: compte.name, email: compte.email, password: MOT_DE_PASSE },
    });

    // Le rôle est attribué côté serveur, après coup :
    // input: false empêche de le fournir à l'inscription.
    await prisma.user.update({ where: { id: user.id }, data: { role: compte.role } });

    ids[compte.email] = user.id;
  }

  return ids;
}

async function creerAnnonces(ids: Record<string, string>) {
  const alice = ids["alice@immo.test"];
  const bruno = ids["bruno@immo.test"];
  const claire = ids["claire@immo.test"];
  const david = ids["david@immo.test"];

  for (let i = 0; i < NB_ANNONCES; i++) {
    const auteurId = i % 2 === 0 ? alice : bruno; // réparties entre les deux agents
    const location = i % 3 === 0;
    const brouillon = i % 6 === 4 || i % 6 === 5; // chaque agent a des brouillons
    const bien = BIENS[i % BIENS.length];
    const ville = VILLES[i % VILLES.length];

    await prisma.annonce.create({
      data: {
        titre: `${bien} — ${ville}`,
        description: `${bien} situé à ${ville}, proche des commerces et des transports. Lumineux, bien entretenu, idéal pour ${location ? "une location à l'année" : "une première acquisition"}.`,
        typeBien: location ? "LOCATION" : "VENTE",
        statutPublication: brouillon ? "BROUILLON" : "PUBLIEE",
        statutBien: i % 7 === 6 ? (location ? "LOUE" : "VENDU") : "DISPONIBLE",
        prix: location ? 450 + i * 35 : 95_000 + i * 12_500,
        dateDisponibilite: new Date(Date.now() + i * 7 * JOUR),
        auteurId,
        // Quelques questions sur les premières annonces publiées, une sur deux avec réponse.
        questions:
          i < 4
            ? {
                create: [
                  {
                    contenu: "Le bien est-il toujours disponible pour une visite ?",
                    auteurId: i % 2 === 0 ? claire : david,
                    reponse: i % 2 === 0 ? "Oui, contactez-nous pour fixer un créneau." : null,
                    reponduLe: i % 2 === 0 ? new Date() : null,
                  },
                ],
              }
            : undefined,
      },
    });
  }

  // Deux favoris pour Claire, sur des annonces publiées.
  const publiees = await prisma.annonce.findMany({
    where: { statutPublication: "PUBLIEE" },
    take: 2,
    select: { id: true },
  });
  await prisma.favori.createMany({
    data: publiees.map((a) => ({ userId: claire, annonceId: a.id })),
  });
}

async function main() {
  await vider();
  const ids = await creerComptes();
  await creerAnnonces(ids);

  const parAgent = await prisma.annonce.groupBy({
    by: ["auteurId", "statutPublication"],
    _count: true,
  });
  console.log("\nSeed terminé :");
  console.log(`  ${COMPTES.length} comptes (mot de passe : SEED_PASSWORD du .env)`);
  console.table(COMPTES.map((c) => ({ email: c.email, role: c.role })));
  console.table(parAgent);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());