import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/session";
import { inscrire } from "../actions";
import { FormulaireAuth } from "../formulaire-auth";

export default async function RegisterPage() {
  if (await utilisateurCourant()) redirect("/annonces");

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Créer un compte</h1>
      <FormulaireAuth mode="inscription" action={inscrire} />
    </main>
  );
}