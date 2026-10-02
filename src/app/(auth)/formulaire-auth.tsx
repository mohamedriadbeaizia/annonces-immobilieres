"use client";
// Client car useActionState : afficher les erreurs renvoyées par la Server Action
// et conserver les valeurs saisies, sans recharger la page.

import Link from "next/link";
import { useActionState } from "react";
import type { EtatFormulaire } from "./actions";

type Props = {
  mode: "inscription" | "connexion";
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
};

export function FormulaireAuth({ mode, action }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {});
  const inscription = mode === "inscription";

  return (
    <form action={formAction} noValidate className="space-y-4">
      {etat.message && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {etat.message}
        </p>
      )}

      {inscription && (
        <Champ
          nom="name"
          libelle="Nom"
          autoComplete="name"
          valeur={etat.valeurs?.name}
          erreurs={etat.erreurs?.name}
        />
      )}
      <Champ
        nom="email"
        libelle="E-mail"
        type="email"
        autoComplete="email"
        valeur={etat.valeurs?.email}
        erreurs={etat.erreurs?.email}
      />
      <Champ
        nom="password"
        libelle="Mot de passe"
        type="password"
        autoComplete={inscription ? "new-password" : "current-password"}
        erreurs={etat.erreurs?.password}
      />

      <button
        type="submit"
        disabled={enCours}
        className="w-full rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enCours ? "Envoi…" : inscription ? "Créer mon compte" : "Se connecter"}
      </button>

      <p className="text-center text-sm text-gray-600">
        {inscription ? (
          <>Déjà inscrit ? <Link href="/login" className="underline">Se connecter</Link></>
        ) : (
          <>Pas encore de compte ? <Link href="/register" className="underline">S&apos;inscrire</Link></>
        )}
      </p>
    </form>
  );
}

function Champ({
  nom,
  libelle,
  type = "text",
  autoComplete,
  valeur,
  erreurs,
}: {
  nom: string;
  libelle: string;
  type?: string;
  autoComplete?: string;
  valeur?: string;
  erreurs?: string[];
}) {
  const idErreur = `${nom}-erreur`;
  return (
    <div className="space-y-1">
      <label htmlFor={nom} className="block text-sm font-medium">
        {libelle}
      </label>
      <input
        id={nom}
        name={nom}
        type={type}
        autoComplete={autoComplete}
        defaultValue={valeur}
        aria-invalid={erreurs ? true : undefined}
        aria-describedby={erreurs ? idErreur : undefined}
        className="w-full rounded border px-3 py-2 aria-invalid:border-red-500"
      />
      {erreurs && (
        <p id={idErreur} className="text-sm text-red-600">
          {erreurs.join(", ")}
        </p>
      )}
    </div>
  );
}