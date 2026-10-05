import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAnnonceVisible } from "@/lib/annonces";
import { formatDate, formatPrix, LIBELLE_STATUT_BIEN, LIBELLE_TYPE } from "@/lib/format";
import { IdAnnonce } from "@/lib/schemas";
import { acteurCourant } from "@/lib/session";
import { Questions } from "./questions";

type Props = { params: Promise<{ id: string }> };

export default async function AnnoncePage({ params }: Props) {
  const { id } = await params;
  const parsed = IdAnnonce.safeParse(id);
  if (!parsed.success) notFound();

  const acteur = await acteurCourant();
  // Brouillon : visible uniquement par son auteur et les admins (règle dans authz.ts).
  const annonce = await getAnnonceVisible(parsed.data, acteur);
  if (!annonce) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {annonce.statutPublication === "BROUILLON" && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Brouillon : cette annonce n&apos;est visible que par son auteur et les administrateurs.
        </p>
      )}

      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          {LIBELLE_TYPE[annonce.typeBien]} · {LIBELLE_STATUT_BIEN[annonce.statutBien]}
        </p>
        <h1 className="text-3xl font-bold">{annonce.titre}</h1>
        <p className="text-2xl font-bold">{formatPrix(annonce.prix, annonce.typeBien)}</p>
        <p className="text-gray-500">
          Disponible le {formatDate(annonce.dateDisponibilite)} · Agent : {annonce.auteur.name}
        </p>
      </header>

      {annonce.photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-2">
          {annonce.photos.map((p) => (
            <li key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- remplacé par next/image en phase 6 */}
              <img src={p.url} alt="" className="aspect-video w-full rounded object-cover" />
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="mb-2 text-xl font-semibold">Description</h2>
        <p className="whitespace-pre-line">{annonce.description}</p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Questions</h2>
        {/* Suspense local plutôt qu'un loading.tsx : voir la justification en phase 2. */}
        <Suspense fallback={<p className="text-gray-500">Chargement des questions…</p>}>
          <Questions annonceId={annonce.id} />
        </Suspense>
      </section>
    </main>
  );
}