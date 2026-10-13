"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { filtreModifiables, peutGererAnnonces } from "@/lib/authz";
import { dossierUploads, EXTENSIONS, NOM_FICHIER, typeReel } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { IdAnnonce, IdPhoto, NB_MAX_PHOTOS_ANNONCE, PhotosInput } from "@/lib/schemas";
import { exigerUtilisateur } from "@/lib/session";

export type EtatPhotos = { erreur?: string; succes?: string };

const INTERDIT = "Annonce introuvable ou action interdite";

function rafraichir(annonceId: number) {
  revalidatePath("/annonces");
  revalidatePath(`/annonces/${annonceId}`);
  revalidatePath(`/annonces/${annonceId}/edit`);
}

export async function ajouterPhotos(_etat: EtatPhotos, formData: FormData): Promise<EtatPhotos> {
  // 1. Authentification
  const acteur = await exigerUtilisateur();

  // 2. Autorisation : l'annonce doit être modifiable par l'acteur (même règle qu'en 4A).
  const annonceId = IdAnnonce.safeParse(formData.get("annonceId"));
  if (!annonceId.success || !peutGererAnnonces(acteur)) throw new Error(INTERDIT);
  const annonce = await prisma.annonce.findFirst({
    where: { id: annonceId.data, ...filtreModifiables(acteur) },
    select: { id: true, _count: { select: { photos: true } } },
  });
  if (!annonce) throw new Error(INTERDIT);

  // 3. Validation
  //    Sans fichier choisi, le navigateur envoie quand même un File vide : on l'écarte.
  const fichiers = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const parsed = PhotosInput.safeParse(fichiers);
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  if (annonce._count.photos + parsed.data.length > NB_MAX_PHOTOS_ANNONCE) {
    return { erreur: `${NB_MAX_PHOTOS_ANNONCE} photos maximum par annonce` };
  }

  //    Vérification du contenu réel, fichier par fichier, AVANT toute écriture.
  const aEcrire: { nom: string; octets: Uint8Array }[] = [];
  for (const fichier of parsed.data) {
    const octets = new Uint8Array(await fichier.arrayBuffer());
    const type = typeReel(octets);
    if (!type) return { erreur: `« ${fichier.name} » n'est pas une image JPEG, PNG ou WebP valide` };
    // Le nom est généré par nous : jamais celui envoyé par le client.
    aEcrire.push({ nom: `${randomUUID()}.${EXTENSIONS[type]}`, octets });
  }

  // 4. Écriture : fichiers d'abord, base ensuite.
  //    Si la base échoue, il reste au pire un fichier orphelin (sans danger),
  //    jamais une ligne en base qui pointerait vers un fichier inexistant.
  const dossier = dossierUploads();
  await mkdir(dossier, { recursive: true });
  for (const { nom, octets } of aEcrire) {
    await writeFile(path.join(dossier, nom), octets);
  }
  await prisma.photo.createMany({
    data: aEcrire.map(({ nom }, i) => ({
      url: `/photos/${nom}`,
      ordre: annonce._count.photos + i,
      annonceId: annonce.id,
    })),
  });

  rafraichir(annonce.id);
  return { succes: `${aEcrire.length} photo${aEcrire.length > 1 ? "s ajoutées" : " ajoutée"}.` };
}

export async function supprimerPhoto(formData: FormData) {
  // 1. Authentification
  const acteur = await exigerUtilisateur();

  // 2. Autorisation : la photo doit appartenir à une annonce que l'acteur peut modifier.
  //    Même principe que repondreQuestion : la propriété passe par la relation.
  const photoId = IdPhoto.safeParse(formData.get("photoId"));
  if (!photoId.success || !peutGererAnnonces(acteur)) throw new Error(INTERDIT);
  const condition = { id: photoId.data, annonce: filtreModifiables(acteur) };
  const photo = await prisma.photo.findFirst({
    where: condition,
    select: { url: true, annonceId: true },
  });
  if (!photo) throw new Error(INTERDIT);

  // 3. Écriture : la base d'abord (la photo disparaît de l'interface), puis le fichier.
  const res = await prisma.photo.deleteMany({ where: condition });
  if (res.count === 0) throw new Error(INTERDIT);

  const nom = path.basename(photo.url);
  if (NOM_FICHIER.test(nom)) {
    // Fichier déjà absent : pas grave, l'objectif (qu'il n'existe plus) est atteint.
    await unlink(path.join(dossierUploads(), nom)).catch(() => {});
  }

  rafraichir(photo.annonceId);
}