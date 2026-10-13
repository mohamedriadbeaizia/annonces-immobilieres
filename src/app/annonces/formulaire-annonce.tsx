"use client";
// Client car useActionState : erreurs affichées champ par champ et valeurs
// conservées après une erreur, sans recharger la page.

import { useActionState } from "react";
import type { EtatAnnonce, ValeursAnnonce } from "./actions";

type Props = {
  action: (etat: EtatAnnonce, formData: FormData) => Promise<EtatAnnonce>;
  annonceId?: number;
  initial?: ValeursAnnonce;
};

const VIDE: ValeursAnnonce = {
  titre: "",
  description: "",
  typeBien: "VENTE",
  statutBien: "DISPONIBLE",
  prix: "",
  dateDisponibilite: "",
};

const CLASSES = "w-full rounded border px-3 py-2 aria-invalid:border-red-500";

export function FormulaireAnnonce({ action, annonceId, initial = VIDE }: Props) {
  const [etat, formAction, enCours] = useActionState(action, {});
  const v = etat.valeurs ?? initial;
  const e = etat.erreurs ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      {annonceId !== undefined && <input type="hidden" name="id" value={annonceId} />}

      {etat.message && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {etat.message}
        </p>
      )}

      <Champ nom="titre" libelle="Titre" erreurs={e.titre}>
        {(p) => <input {...p} type="text" defaultValue={v.titre} />}
      </Champ>

      <Champ nom="description" libelle="Description" erreurs={e.description}>
        {(p) => <textarea {...p} rows={6} defaultValue={v.description} />}
      </Champ>

      <div className="grid gap-4 sm:grid-cols-2">
        <Champ nom="typeBien" libelle="Type de bien" erreurs={e.typeBien}>
          {(p) => (
            <select {...p} defaultValue={v.typeBien}>
              <option value="VENTE">Vente</option>
              <option value="LOCATION">Location</option>
            </select>
          )}
        </Champ>

        <Champ nom="statutBien" libelle="Statut du bien" erreurs={e.statutBien}>
          {(p) => (
            <select {...p} defaultValue={v.statutBien}>
              <option value="DISPONIBLE">Disponible</option>
              <option value="LOUE">Loué</option>
              <option value="VENDU">Vendu</option>
            </select>
          )}
        </Champ>

        <Champ nom="prix" libelle="Prix (€, ou € / mois pour une location)" erreurs={e.prix}>
          {(p) => <input {...p} type="number" min={1} step={1} defaultValue={v.prix} />}
        </Champ>

        <Champ nom="dateDisponibilite" libelle="Date de disponibilité" erreurs={e.dateDisponibilite}>
          {(p) => <input {...p} type="date" defaultValue={v.dateDisponibilite} />}
        </Champ>
      </div>

      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

type ProprietesChamp = {
  id: string;
  name: string;
  className: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

// Relie chaque champ à son <label> (htmlFor) et à son message d'erreur (aria-describedby).
function Champ({
  nom,
  libelle,
  erreurs,
  children,
}: {
  nom: string;
  libelle: string;
  erreurs?: string[];
  children: (p: ProprietesChamp) => React.ReactNode;
}) {
  const idErreur = `${nom}-erreur`;
  return (
    <div className="space-y-1">
      <label htmlFor={nom} className="block text-sm font-medium">
        {libelle}
      </label>
      {children({
        id: nom,
        name: nom,
        className: CLASSES,
        "aria-invalid": erreurs ? true : undefined,
        "aria-describedby": erreurs ? idErreur : undefined,
      })}
      {erreurs && (
        <p id={idErreur} className="text-sm text-red-600">
          {erreurs.join(", ")}
        </p>
      )}
    </div>
  );
}