import Image from "next/image";
import Link from "next/link";
import { listerAnnoncesPubliees } from "@/lib/annonces";
import { formatDate, formatPrix, LIBELLE_STATUT_BIEN, LIBELLE_TYPE } from "@/lib/format";
import { FiltresListe } from "@/lib/schemas";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function lien(page: number, type?: "VENTE" | "LOCATION") {
  const q = new URLSearchParams();
  if (type) q.set("type", type);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `/annonces?${s}` : "/annonces";
}

const FILTRES = [
  { libelle: "Toutes", type: undefined },
  { libelle: "Vente", type: "VENTE" },
  { libelle: "Location", type: "LOCATION" },
] as const;

// Composant serveur : la requête SQL part d'ici, le HTML arrive déjà rempli.
export default async function AnnoncesPage({ searchParams }: Props) {
  // searchParams est une Promise depuis Next 15 : on l'attend, puis on valide.
  const { page, type } = FiltresListe.parse(await searchParams);
  const { annonces, total, pages } = await listerAnnoncesPubliees({ page, type });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Annonces</h1>

      <nav aria-label="Filtrer par type" className="mb-6 flex gap-2">
        {FILTRES.map((f) => (
          <Link
            key={f.libelle}
            href={lien(1, f.type)}
            aria-current={type === f.type ? "page" : undefined}
            className={`rounded-full border px-4 py-1 text-sm ${
              type === f.type ? "bg-gray-900 text-white" : "hover:bg-gray-100"
            }`}
          >
            {f.libelle}
          </Link>
        ))}
      </nav>

      {annonces.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          Aucune annonce pour le moment.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a) => (
            <li key={a.id}>
              <Link
                href={`/annonces/${a.id}`}
                className="block overflow-hidden rounded-lg border shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-video bg-gray-100">
                  {a.photos[0] ? (
                    <Image
                      src={a.photos[0].url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm text-gray-400">
                      Pas de photo
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {LIBELLE_TYPE[a.typeBien]} · {LIBELLE_STATUT_BIEN[a.statutBien]}
                  </p>
                  <h2 className="text-lg font-semibold">{a.titre}</h2>
                  <p className="text-xl font-bold">{formatPrix(a.prix, a.typeBien)}</p>
                  <p className="text-sm text-gray-500">
                    Disponible le {formatDate(a.dateDisponibilite)} · {a.auteur.name}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link href={lien(page - 1, type)} className="rounded border px-3 py-1 hover:bg-gray-100">
              ← Précédente
            </Link>
          ) : (
            <span className="px-3 py-1 text-gray-300">← Précédente</span>
          )}
          <span className="text-sm">
            Page {page} / {pages} · {total} annonce{total > 1 ? "s" : ""}
          </span>
          {page < pages ? (
            <Link href={lien(page + 1, type)} className="rounded border px-3 py-1 hover:bg-gray-100">
              Suivante →
            </Link>
          ) : (
            <span className="px-3 py-1 text-gray-300">Suivante →</span>
          )}
        </nav>
      )}
    </main>
  );
}