import path from "node:path";
import { env } from "./env";



// Types acceptés, et l'extension que NOUS choisissons pour chacun.
// On ne réutilise jamais le nom ni l'extension fournis par le client.
export const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

// Forme exacte d'un nom de fichier généré par nous : uuid + extension.
// Tout autre nom est refusé, ce qui ferme la porte aux chemins du type ../../.env
export const NOM_FICHIER = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export function dossierUploads() {
  // UPLOAD_DIR déjà validée au démarrage par env.ts.
  return path.resolve(env.UPLOAD_DIR);
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