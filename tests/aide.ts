import { randomUUID } from "node:crypto";
import type { Role } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

/** Vide la base de TEST (enfants avant parents, à cause des clés étrangères). */
export async function viderBase() {
  await prisma.favori.deleteMany();
  await prisma.question.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.annonce.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Utilisateur de test créé directement en base.
 * Contrairement au seed, pas besoin de passer par Better Auth : ces comptes ne se
 * connectent jamais, les tests fournissent directement l'acteur aux fonctions testées.
 */
export async function creerUtilisateur(role: Role) {
  const id = randomUUID();
  return prisma.user.create({
    data: { id, name: `${role} ${id.slice(0, 4)}`, email: `${id}@test.local`, role },
  });
}

export async function creerAnnonce(
  auteurId: string,
  statutPublication: "BROUILLON" | "PUBLIEE" = "PUBLIEE",
  titre = "Annonce de test",
) {
  return prisma.annonce.create({
    data: {
      titre,
      description: "Description de test, suffisamment longue pour être valide.",
      typeBien: "VENTE",
      prix: 150_000,
      dateDisponibilite: new Date(),
      statutPublication,
      auteurId,
    },
  });
}