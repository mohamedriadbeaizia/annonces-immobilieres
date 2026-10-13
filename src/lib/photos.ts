import path from "node:path";
import { env } from "./env";

export const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo par photo
export const NB_MAX_PAR_ENVOI = 4;

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