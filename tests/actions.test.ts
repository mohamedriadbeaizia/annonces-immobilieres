import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  creerAnnonce as creerAnnonceAction,
  modifierAnnonce,
  supprimerAnnonce,
} from "@/app/annonces/actions";
import type { Acteur } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { creerAnnonce, creerUtilisateur, viderBase } from "./aide";

// ─── Ce qu'on remplace, et pourquoi ──────────────────────────────────────────
// Seules les dépendances propres à Next sont simulées. L'autorisation, la validation,
// Prisma et la base de données restent RÉELLES : c'est bien la vraie action qu'on teste.

// vi.hoisted : vi.mock est remonté en haut du fichier par Vitest, avant les déclarations.
// Cette variable doit donc être créée avec lui.
const session = vi.hoisted(() => ({ acteur: null as Acteur | null }));

// La session : c'est le test qui décide qui est connecté.
vi.mock("@/lib/session", () => ({
  acteurCourant: async () => session.acteur,
  exigerUtilisateur: async () => {
    if (!session.acteur) throw new Error("non connecté");
    return session.acteur;
  },
}));

// Cache et navigation de Next : sans objet hors d'une requête HTTP.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));

const INTERDIT = "Annonce introuvable ou action interdite";

/** Construit un FormData comme celui qu'enverrait le navigateur. */
function formulaire(champs: Record<string, string | number>) {
  const donnees = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) donnees.set(cle, String(valeur));
  return donnees;
}

const annonceValide = {
  titre: "Appartement vue mer",
  description: "Appartement lumineux au dernier étage, vue dégagée sur le port.",
  typeBien: "LOCATION",
  statutBien: "DISPONIBLE",
  prix: 850,
  dateDisponibilite: "2026-12-01",
};

const existe = async (id: number) => (await prisma.annonce.count({ where: { id } })) === 1;

beforeEach(async () => {
  session.acteur = null;
  await viderBase();
});
afterAll(() => prisma.$disconnect());

describe("IDOR : suppression d'une annonce", () => {
  it("l'agent A ne peut PAS supprimer l'annonce de l'agent B", async () => {
    const alice = await creerUtilisateur("AGENT");
    const bruno = await creerUtilisateur("AGENT");
    const annonceBruno = await creerAnnonce(bruno.id);

    // Alice est connectée et envoie l'id d'une annonce de Bruno, exactement
    // comme en modifiant le champ caché dans le navigateur.
    session.acteur = { id: alice.id, role: "AGENT" };
    await expect(supprimerAnnonce(formulaire({ id: annonceBruno.id }))).rejects.toThrow(INTERDIT);

    expect(await existe(annonceBruno.id)).toBe(true);
  });

  it("contre-test : l'agent B peut supprimer sa propre annonce", async () => {
    // Sans ce test, une action qui refuserait TOUT passerait le test précédent.
    const bruno = await creerUtilisateur("AGENT");
    const annonceBruno = await creerAnnonce(bruno.id);

    session.acteur = { id: bruno.id, role: "AGENT" };
    await supprimerAnnonce(formulaire({ id: annonceBruno.id }));

    expect(await existe(annonceBruno.id)).toBe(false);
  });

  it("un admin peut supprimer l'annonce de n'importe quel agent", async () => {
    const alice = await creerUtilisateur("AGENT");
    const admin = await creerUtilisateur("ADMIN");
    const annonceAlice = await creerAnnonce(alice.id);

    session.acteur = { id: admin.id, role: "ADMIN" };
    await supprimerAnnonce(formulaire({ id: annonceAlice.id }));

    expect(await existe(annonceAlice.id)).toBe(false);
  });
});

describe("règles métier appliquées par les actions", () => {
  it("un agent ne peut PAS modifier l'annonce d'un autre agent", async () => {
    const alice = await creerUtilisateur("AGENT");
    const bruno = await creerUtilisateur("AGENT");
    const annonceBruno = await creerAnnonce(bruno.id, "PUBLIEE", "Titre d'origine");

    session.acteur = { id: alice.id, role: "AGENT" };
    await expect(
      modifierAnnonce({}, formulaire({ ...annonceValide, id: annonceBruno.id, titre: "Titre piraté" })),
    ).rejects.toThrow(INTERDIT);

    const apres = await prisma.annonce.findUniqueOrThrow({ where: { id: annonceBruno.id } });
    expect(apres.titre).toBe("Titre d'origine");
  });

  it("un USER ne peut pas créer d'annonce", async () => {
    const claire = await creerUtilisateur("USER");

    session.acteur = { id: claire.id, role: "USER" };
    await expect(creerAnnonceAction({}, formulaire(annonceValide))).rejects.toThrow(INTERDIT);

    expect(await prisma.annonce.count()).toBe(0);
  });

  it("un prix négatif est refusé par l'action, et rien n'est créé", async () => {
    const alice = await creerUtilisateur("AGENT");

    session.acteur = { id: alice.id, role: "AGENT" };
    const etat = await creerAnnonceAction({}, formulaire({ ...annonceValide, prix: -5 }));

    expect(etat?.erreurs?.prix).toContain("Le prix doit être positif");
    expect(await prisma.annonce.count()).toBe(0);
  });
});