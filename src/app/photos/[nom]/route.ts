import { lirePhoto, NOM_FICHIER, TYPES_MIME } from "@/lib/photos";

// Route en LECTURE seule : sert une photo, qu'elle soit stockée sur le disque
// (local) ou sur Vercel Blob (production). Voir src/lib/photos.ts.
export async function GET(_requete: Request, { params }: { params: Promise<{ nom: string }> }) {
  const { nom } = await params;

  // Seuls les noms que NOUS générons (uuid + extension) sont acceptés.
  // Bloque toute tentative de path traversal : /photos/..%2F..%2F.env → 404.
  if (!NOM_FICHIER.test(nom)) {
    return new Response("Introuvable", { status: 404 });
  }

  const extension = nom.slice(nom.lastIndexOf(".") + 1) as keyof typeof TYPES_MIME;

  try {
    const contenu = await lirePhoto(nom);
    if (!contenu) return new Response("Introuvable", { status: 404 });

    return new Response(contenu as BodyInit, {
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