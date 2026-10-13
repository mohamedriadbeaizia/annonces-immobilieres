import { notFound } from "next/navigation";
import { peutGererAnnonces } from "@/lib/authz";
import { exigerUtilisateur } from "@/lib/session";
import { creerAnnonce } from "../actions";
import { FormulaireAnnonce } from "../formulaire-annonce";

export default async function NouvelleAnnoncePage() {
  const acteur = await exigerUtilisateur(); // anonyme → 307 vers /login
  if (!peutGererAnnonces(acteur)) notFound(); // USER → 404

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Nouvelle annonce</h1>
      <p className="mb-6 text-sm text-gray-500">
        L&apos;annonce est créée en brouillon. Vous pourrez la publier ensuite.
      </p>
      <FormulaireAnnonce action={creerAnnonce} />
    </main>
  );
}