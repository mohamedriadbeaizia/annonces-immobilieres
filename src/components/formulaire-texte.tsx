"use client";
// Client car useActionState : erreur sous le champ, texte conservé après une erreur,
// message de succès, sans rechargement.

import { useActionState, useId } from "react";
import type { EtatTexte } from "@/app/annonces/actions";

type Props = {
  action: (etat: EtatTexte, formData: FormData) => Promise<EtatTexte>;
  nom: "contenu" | "reponse";
  libelle: string;
  bouton: string;
  caches: Record<string, string | number>;
};

export function FormulaireTexte({ action, nom, libelle, bouton, caches }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {});
  // useId : plusieurs formulaires de réponse sur la même page → ids HTML uniques.
  const id = useId();
  const idErreur = `${id}-erreur`;
  const erreurs = etat.erreurs?.[nom];

  return (
    <form action={formAction} noValidate className="space-y-2">
      {Object.entries(caches).map(([cle, valeur]) => (
        <input key={cle} type="hidden" name={cle} value={valeur} />
      ))}

      <label htmlFor={id} className="block text-sm font-medium">
        {libelle}
      </label>
      <textarea
        id={id}
        name={nom}
        rows={3}
        defaultValue={etat.valeur}
        aria-invalid={erreurs ? true : undefined}
        aria-describedby={erreurs ? idErreur : undefined}
        className="w-full rounded border px-3 py-2 aria-invalid:border-red-500"
      />
      {erreurs && (
        <p id={idErreur} className="text-sm text-red-600">
          {erreurs.join(", ")}
        </p>
      )}
      {etat.succes && (
        <p role="status" className="text-sm text-green-700">
          {etat.succes}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {enCours ? "Envoi…" : bouton}
      </button>
    </form>
  );
}