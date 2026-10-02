"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ConnexionInput, InscriptionInput } from "@/lib/schemas";

export type EtatFormulaire = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
  // Valeurs renvoyées pour pré-remplir le formulaire après une erreur.
  // Jamais le mot de passe.
  valeurs?: { name?: string; email?: string };
};

export async function inscrire(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  // Pas de vérification d'authentification ni d'autorisation : l'inscription
  // est ouverte aux visiteurs. On passe directement à la validation.
  const valeurs = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = InscriptionInput.safeParse({ ...valeurs, password: formData.get("password") });
  if (!parsed.success) {
    return { erreurs: z.flattenError(parsed.error).fieldErrors, valeurs };
  }

  try {
    // On transmet UNIQUEMENT name, email, password validés.
    // Même si le formulaire contenait role=ADMIN, il n'arrive jamais ici.
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (e) {
    if (e instanceof APIError) {
      return { message: "Impossible de créer ce compte (adresse déjà utilisée ?)", valeurs };
    }
    throw e;
  }

  // redirect() hors du try : il fonctionne en levant une exception interne
  // que le catch intercepterait sinon.
  redirect("/annonces");
}

export async function connecter(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = { email: String(formData.get("email") ?? "") };
  const parsed = ConnexionInput.safeParse({ ...valeurs, password: formData.get("password") });
  if (!parsed.success) {
    return { erreurs: z.flattenError(parsed.error).fieldErrors, valeurs };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (e) {
    if (e instanceof APIError) {
      // Message volontairement générique : on ne révèle pas si l'e-mail existe.
      return { message: "E-mail ou mot de passe incorrect", valeurs };
    }
    throw e;
  }

  redirect("/annonces");
}

export async function deconnecter() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/annonces");
}