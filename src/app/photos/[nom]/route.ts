import { readFile } from "node:fs/promises";
import path from "node:path";
import { dossierUploads, NOM_FICHIER } from "@/lib/photos";

const TYPES_MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

// Route en LECTURE seule : sert une photo stockée hors de public/.
// (Next ne sert depuis public/ que les fichiers présents au moment du build.)
export async function GET(_requete: Request, { params }: { params: Promise<{ nom: string }> }) {
  const { nom } = await params;

  // Seuls les noms que NOUS générons (uuid + extension) sont acceptés.
  // Bloque toute tentative de path traversal : /photos/..%2F..%2F.env → 404.
  if (!NOM_FICHIER.test(nom)) {
    return new Response("Introuvable", { status: 404 });
  }

  const extension = nom.slice(nom.lastIndexOf(".") + 1) as keyof typeof TYPES_MIME;

  try {
    const contenu = await readFile(path.join(dossierUploads(), nom));
    return new Response(new Uint8Array(contenu), {
      headers: {
        "Content-Type": TYPES_MIME[extension],
        // Le nom est un uuid unique, jamais réutilisé : le navigateur peut garder la photo en cache.
        "Cache-Control": "public, max-age=31536000, immutable",
        // Empêche le navigateur de "deviner" un autre type que celui annoncé.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}