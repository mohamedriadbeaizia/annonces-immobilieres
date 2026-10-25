import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { env } from "./env";

// Types acceptés, et l'extension que NOUS choisissons pour chacun.
// On ne réutilise jamais le nom ni l'extension fournis par le client.
export const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const TYPES_MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

// Forme exacte d'un nom de fichier généré par nous : uuid + extension.
// Tout autre nom est refusé, ce qui ferme la porte aux chemins du type ../../.env
export const NOM_FICHIER = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

/* ==================================================================
   STOCKAGE — deux implémentations derrière la même interface :
   - en local : fichiers dans UPLOAD_DIR (comme avant) ;
   - en production (Vercel) : Vercel Blob, dès qu'un store est relié
     (BLOB_STORE_ID, ou BLOB_READ_WRITE_TOKEN). Le disque de Vercel est en
     lecture seule et non partagé entre les instances : les fichiers n'y
     survivraient pas.
   Le reste de l'application ne sait pas où vont les photos.
   ================================================================== */

const surBlob = () => Boolean(env.BLOB_STORE_ID || env.BLOB_READ_WRITE_TOKEN);

// Store Blob en accès PRIVÉ : les photos ne sont servies que par notre
// route /photos/[nom], avec ses contrôles (nom validé, en-têtes de sécurité).
const ACCES = "private" as const;
const cheminBlob = (nom: string) => `photos/${nom}`;

export function dossierUploads() {
  // UPLOAD_DIR déjà validée au démarrage par env.ts.
  return path.resolve(env.UPLOAD_DIR);
}

function verifierNom(nom: string) {
  // Garde-fou : on n'écrit / lit / supprime jamais un nom qui n'est pas de nous.
  if (!NOM_FICHIER.test(nom)) throw new Error(`Nom de photo invalide : ${nom}`);
}

/** Enregistre une photo déjà validée (type réel vérifié, nom généré par nous). */
export async function enregistrerPhoto(nom: string, octets: Uint8Array) {
  verifierNom(nom);
  const extension = nom.slice(nom.lastIndexOf(".") + 1) as keyof typeof TYPES_MIME;

  if (surBlob()) {
    await put(cheminBlob(nom), Buffer.from(octets), {
      access: ACCES,
      contentType: TYPES_MIME[extension],
      addRandomSuffix: false, // le nom est déjà un uuid unique
    });
    return;
  }

  await mkdir(dossierUploads(), { recursive: true });
  await writeFile(path.join(dossierUploads(), nom), octets);
}

/** Contenu d'une photo, ou null si elle n'existe pas. */
export async function lirePhoto(nom: string): Promise<ReadableStream<Uint8Array> | Uint8Array | null> {
  verifierNom(nom);

  if (surBlob()) {
    const resultat = await get(cheminBlob(nom), { access: ACCES });
    return resultat?.statusCode === 200 ? resultat.stream : null;
  }

  try {
    return new Uint8Array(await readFile(path.join(dossierUploads(), nom)));
  } catch {
    return null;
  }
}

/** Supprime une photo. Ne lève pas d'erreur si elle a déjà disparu. */
export async function supprimerFichierPhoto(nom: string) {
  verifierNom(nom);

  if (surBlob()) {
    await del(cheminBlob(nom));
    return;
  }

  await unlink(path.join(dossierUploads(), nom)).catch(() => {});
}

/**
 * Type RÉEL du fichier, d'après ses premiers octets (signature).
 * Le type annoncé par le navigateur vient de l'extension : il se falsifie
 * en renommant le fichier. La signature, elle, fait partie du contenu.
 */
export function typeReel(octets: Uint8Array): keyof typeof EXTENSIONS | null {
  const commencePar = (...valeurs: number[]) => valeurs.every((v, i) => octets[i] === v);
  const texte = (de: number, a: number) => String.fromCharCode(...octets.subarray(de, a));

  if (commencePar(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (commencePar(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (texte(0, 4) === "RIFF" && texte(8, 12) === "WEBP") return "image/webp";
  return null;
}