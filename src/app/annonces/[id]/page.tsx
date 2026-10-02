import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAnnoncePublique } from "@/lib/annonces";
import { formatDate, formatPrix, LIBELLE_STATUT_BIEN, LIBELLE_TYPE } from "@/lib/format";
import { IdAnnonce } from "@/lib/schemas";
import { Questions } from "./questions";

type Props = { params: Promise<{ id: string }> };

export default async function AnnoncePage({ params }: Props) {
  // params est une Promise (Next 15+). Sans await, id serait undefined
  // et la page s'afficherait vide... avec un build pourtant vert.
  const { id } = await params;

  const parsed = IdAnnonce.safeParse(id);
  if (!parsed.success) notFound(); // /annonces/abc → 404

  const annonce = await getAnnoncePublique(parsed.data);
  if (!annonce) notFound(); // /annonces/999999 ou brouillon → 404

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
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
        {/*
          Suspense LOCAL plutôt qu'un loading.tsx :
          - l'essentiel (titre, prix, description) s'affiche tout de suite,
            les questions (liste qui grandit avec le temps) arrivent ensuite en streaming ;
          - notFound() est appelé AVANT cette frontière, donc le statut 404 est encore
            modifiable. Un loading.tsx dans app/annonces/ mettrait tout le sous-arbre
            en streaming et figerait le statut à 200.
        */}
        <Suspense fallback={<p className="text-gray-500">Chargement des questions…</p>}>
          <Questions annonceId={annonce.id} />
        </Suspense>
      </section>
    </main>
  );
}