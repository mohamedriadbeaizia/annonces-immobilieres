import Link from "next/link";
import { listerFavoris } from "@/lib/annonces";
import { formatPrix, LIBELLE_STATUT_BIEN } from "@/lib/format";
import { exigerUtilisateur } from "@/lib/session";

export default async function FavorisPage() {
  const acteur = await exigerUtilisateur(); // anonyme → /login
  // L'id vient de la session : chacun ne voit que SES favoris.
  const favoris = await listerFavoris(acteur.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mes favoris</h1>

      {favoris.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          Aucun favori.{" "}
          <Link href="/annonces" className="underline">
            Parcourir les annonces
          </Link>
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {favoris.map(({ annonce }) => (
            <li key={annonce.id} className="p-4">
              <Link href={`/annonces/${annonce.id}`} className="font-medium hover:underline">
                {annonce.titre}
              </Link>
              <p className="text-sm text-gray-500">
                {formatPrix(annonce.prix, annonce.typeBien)} · {LIBELLE_STATUT_BIEN[annonce.statutBien]}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}