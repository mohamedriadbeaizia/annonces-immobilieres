"use client";
// Client car useActionState : afficher l'erreur ou le succès renvoyés par l'action
// sans recharger la page.

import { useActionState, useId } from "react";
import { NB_MAX_PHOTOS_ENVOI } from "@/lib/schemas";
import { ajouterPhotos } from "./photos-actions";

export function FormulairePhotos({ annonceId }: { annonceId: number }) {
  const [etat, formAction, enCours] = useActionState(ajouterPhotos, {});
  const id = useId();
  const idMessage = `${id}-message`;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="annonceId" value={annonceId} />

      <label htmlFor={id} className="block text-sm font-medium">
        Ajouter des photos (JPEG, PNG ou WebP, 5 Mo max, {NB_MAX_PHOTOS_ENVOI} par envoi)
      </label>
      {/* Un input file accepte nativement le glisser-déposer : on le présente en grande zone. */}
      <input
        id={id}
        name="photos"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        aria-invalid={etat.erreur ? true : undefined}
        aria-describedby={etat.erreur || etat.succes ? idMessage : undefined}
        className="block w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-sm text-gray-600 hover:bg-gray-50 aria-invalid:border-red-500 file:mr-4 file:rounded file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-white"
      />
      <p className="text-xs text-gray-500">Cliquez pour choisir, ou glissez-déposez vos fichiers dans la zone.</p>

      {etat.erreur && (
        <p id={idMessage} role="alert" className="text-sm text-red-600">
          {etat.erreur}
        </p>
      )}
      {etat.succes && (
        <p id={idMessage} role="status" className="text-sm text-green-700">
          {etat.succes}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {enCours ? "Envoi…" : "Envoyer les photos"}
      </button>
    </form>
  );
}