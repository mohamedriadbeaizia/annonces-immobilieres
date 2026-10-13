import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionsAnnonce } from "@/components/actions-annonce";
import { listerAnnoncesGerees } from "@/lib/annonces";
import { peutGererAnnonces } from "@/lib/authz";
import { formatPrix, LIBELLE_STATUT_BIEN } from "@/lib/format";
import { exigerUtilisateur } from "@/lib/session";

export default async function MesAnnoncesPage() {
  const acteur = await exigerUtilisateur();
  if (!peutGererAnnonces(acteur)) notFound();

  const annonces = await listerAnnoncesGerees(acteur);
  const admin = acteur.role === "ADMIN";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{admin ? "Toutes les annonces" : "Mes annonces"}</h1>
        <Link href="/annonces/new" className="rounded bg-gray-900 px-4 py-2 text-sm text-white">
          Nouvelle annonce
        </Link>
      </div>

      {annonces.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          Aucune annonce. Créez votre première annonce.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {annonces.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <Link href={`/annonces/${a.id}`} className="font-medium hover:underline">
                  {a.titre}
                </Link>
                <p className="text-sm text-gray-500">
                  <span
                    className={`mr-2 rounded px-2 py-0.5 text-xs font-medium ${
                      a.statutPublication === "PUBLIEE"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {a.statutPublication === "PUBLIEE" ? "Publiée" : "Brouillon"}
                  </span>
                  {formatPrix(a.prix, a.typeBien)} · {LIBELLE_STATUT_BIEN[a.statutBien]} ·{" "}
                  {a._count.questions} question{a._count.questions > 1 ? "s" : ""}
                  {admin && <> · {a.auteur.name}</>}
                </p>
              </div>
              <ActionsAnnonce annonce={a} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}