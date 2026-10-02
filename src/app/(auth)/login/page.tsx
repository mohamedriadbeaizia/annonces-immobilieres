import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/session";
import { connecter } from "../actions";
import { FormulaireAuth } from "../formulaire-auth";

export default async function LoginPage() {
  if (await utilisateurCourant()) redirect("/annonces");

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
      <FormulaireAuth mode="connexion" action={connecter} />
    </main>
  );
}