"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { filtreModifiables, peutGererAnnonces } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { AnnonceInput, IdAnnonce, PublicationInput } from "@/lib/schemas";
import { exigerUtilisateur } from "@/lib/session";

export type ValeursAnnonce = {
  titre: string;
  description: string;
  typeBien: string;
  statutBien: string;
  prix: string;
  dateDisponibilite: string;
};

export type EtatAnnonce = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
  valeurs?: ValeursAnnonce;
};

// Même message que l'annonce n'existe pas ou qu'elle appartienne à un autre :
// on ne révèle pas l'existence d'une annonce qu'on n'a pas le droit de toucher.
const INTERDIT = "Annonce introuvable ou action interdite";

function lireAnnonce(formData: FormData): ValeursAnnonce {
  return {
    titre: String(formData.get("titre") ?? ""),
    description: String(formData.get("description") ?? ""),
    typeBien: String(formData.get("typeBien") ?? ""),
    statutBien: String(formData.get("statutBien") ?? ""),
    prix: String(formData.get("prix") ?? ""),
    dateDisponibilite: String(formData.get("dateDisponibilite") ?? ""),
  };
}

function rafraichir(id?: number) {
  revalidatePath("/annonces");
  revalidatePath("/mes-annonces");
  if (id) revalidatePath(`/annonces/${id}`);
}

// ─── Créer ───────────────────────────────────────────────────────────────────

export async function creerAnnonce(_etat: EtatAnnonce, formData: FormData): Promise<EtatAnnonce> {
  // 1. Authentification
  const acteur = await exigerUtilisateur();
  // 2. Autorisation
  if (!peutGererAnnonces(acteur)) throw new Error(INTERDIT);
  // 3. Validation
  const valeurs = lireAnnonce(formData);
  const parsed = AnnonceInput.safeParse(valeurs);
  if (!parsed.success) return { erreurs: z.flattenError(parsed.error).fieldErrors, valeurs };
  // 4. Écriture. L'auteur vient de la SESSION, jamais du formulaire.
  //    Nouvelle annonce = brouillon (valeur par défaut du schéma Prisma).
  const annonce = await prisma.annonce.create({ data: { ...parsed.data, auteurId: acteur.id } });

  rafraichir(annonce.id);
  redirect(`/annonces/${annonce.id}`);
}

// ─── Modifier ────────────────────────────────────────────────────────────────

export async function modifierAnnonce(_etat: EtatAnnonce, formData: FormData): Promise<EtatAnnonce> {
  // 1. Authentification
  const acteur = await exigerUtilisateur();
  // 2. Autorisation. L'id vient du formulaire, donc du client : on le valide d'abord
  //    (il faut bien savoir de quelle annonce on parle), puis on vérifie la propriété.
  const id = IdAnnonce.safeParse(formData.get("id"));
  if (!id.success || !peutGererAnnonces(acteur)) throw new Error(INTERDIT);
  const cible = await prisma.annonce.findFirst({
    where: { id: id.data, ...filtreModifiables(acteur) },
    select: { id: true },
  });
  if (!cible) throw new Error(INTERDIT);
  // 3. Validation du contenu
  const valeurs = lireAnnonce(formData);
  const parsed = AnnonceInput.safeParse(valeurs);
  if (!parsed.success) return { erreurs: z.flattenError(parsed.error).fieldErrors, valeurs };
  // 4. Écriture. La propriété est AUSSI dans le WHERE de l'écriture :
  //    même si la vérification ci-dessus était un jour supprimée, l'IDOR resterait impossible.
  const res = await prisma.annonce.updateMany({
    where: { id: cible.id, ...filtreModifiables(acteur) },
    data: parsed.data,
  });
  if (res.count === 0) throw new Error(INTERDIT);

  rafraichir(cible.id);
  redirect(`/annonces/${cible.id}`);
}

// ─── Supprimer ───────────────────────────────────────────────────────────────

export async function supprimerAnnonce(formData: FormData) {
  // 1. Authentification
  const acteur = await exigerUtilisateur();
  // 2. Autorisation (+ validation de l'id, indispensable pour savoir quoi supprimer)
  const id = IdAnnonce.safeParse(formData.get("id"));
  if (!id.success || !peutGererAnnonces(acteur)) throw new Error(INTERDIT);
  // 3. Écriture : la propriété fait partie de la condition.
  //    Agent A avec l'id d'une annonce de B → 0 ligne supprimée → erreur.
  const res = await prisma.annonce.deleteMany({
    where: { id: id.data, ...filtreModifiables(acteur) },
  });
  if (res.count === 0) throw new Error(INTERDIT);

  rafraichir(id.data);
  redirect("/mes-annonces");
}

// ─── Publier / dépublier ─────────────────────────────────────────────────────

export async function changerPublication(formData: FormData) {
  // 1. Authentification
  const acteur = await exigerUtilisateur();
  // 2. Autorisation + validation des deux champs envoyés par le client
  const id = IdAnnonce.safeParse(formData.get("id"));
  const publier = PublicationInput.safeParse(formData.get("publier"));
  if (!id.success || !publier.success || !peutGererAnnonces(acteur)) throw new Error(INTERDIT);
  // 3. Écriture, propriété dans la condition
  const res = await prisma.annonce.updateMany({
    where: { id: id.data, ...filtreModifiables(acteur) },
    data: { statutPublication: publier.data === "true" ? "PUBLIEE" : "BROUILLON" },
  });
  if (res.count === 0) throw new Error(INTERDIT);

  rafraichir(id.data);
}