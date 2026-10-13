import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionsAnnonce } from "@/components/actions-annonce";
import { FormulaireTexte } from "@/components/formulaire-texte";
import { estFavori, getAnnonceVisible } from "@/lib/annonces";
import { estProprietaireOuAdmin, peutPoserQuestion } from "@/lib/authz";
import { formatDate, formatPrix, LIBELLE_STATUT_BIEN, LIBELLE_TYPE } from "@/lib/format";
import { IdAnnonce } from "@/lib/schemas";
import { acteurCourant } from "@/lib/session";
import { basculerFavori, poserQuestion } from "../actions";
import { Questions } from "./questions";
import Image from "next/image";

type Props = { params: Promise<{ id: string }> };

export default async function AnnoncePage({ params }: Props) {
  const { id } = await params;
  const parsed = IdAnnonce.safeParse(id);
  if (!parsed.success) notFound();

  const acteur = await acteurCourant();
  // Brouillon : visible uniquement par son auteur et les admins (règle dans authz.ts).
  const annonce = await getAnnonceVisible(parsed.data, acteur);
  if (!annonce) notFound();

  // Simple confort d'affichage : les vraies vérifications sont dans les Server Actions.
  const gestionnaire = acteur !== null && estProprietaireOuAdmin(acteur, annonce);
  const publiee = annonce.statutPublication === "PUBLIEE";
  // Requête seulement si elle a un sens (connecté + annonce publiée).
  const favori = acteur && publiee ? await estFavori(acteur.id, annonce.id) : false;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {!publiee && (
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

        <div className="flex flex-wrap items-center gap-2">
          {acteur && publiee && (
            <form action={basculerFavori}>
              <input type="hidden" name="annonceId" value={annonce.id} />
              <button
                type="submit"
                aria-pressed={favori}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
              >
                {favori ? "★ Retirer des favoris" : "☆ Ajouter aux favoris"}
              </button>
            </form>
          )}
          {gestionnaire && <ActionsAnnonce annonce={annonce} />}
        </div>
      </header>

      {annonce.photos.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {annonce.photos.map((p, i) => (
            <li key={p.id} className="relative aspect-video overflow-hidden rounded bg-gray-100">
              <Image
                src={p.url}
                alt={`Photo ${i + 1} : ${annonce.titre}`}
                fill
                // Première photo chargée en priorité : c'est celle qu'on voit en arrivant.
                priority={i === 0}
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="mb-2 text-xl font-semibold">Description</h2>
        <p className="whitespace-pre-line">{annonce.description}</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Questions</h2>

        {/* Suspense local plutôt qu'un loading.tsx : voir la justification en phase 2. */}
        <Suspense fallback={<p className="text-gray-500">Chargement des questions…</p>}>
          <Questions annonceId={annonce.id} peutRepondre={gestionnaire} />
        </Suspense>

        {peutPoserQuestion(acteur, annonce) ? (
          <FormulaireTexte
            action={poserQuestion}
            nom="contenu"
            libelle="Poser une question"
            bouton="Envoyer"
            caches={{ annonceId: annonce.id }}
          />
        ) : (
          !acteur && (
            <p className="text-sm text-gray-500">
              <Link href="/login" className="underline">
                Connectez-vous
              </Link>{" "}
              pour poser une question.
            </p>
          )
        )}
      </section>
    </main>
  );
}