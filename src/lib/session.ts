import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import type { Acteur, Role } from "./authz";

// cache() de React : mémoïsation LE TEMPS D'UNE REQUÊTE uniquement.
// La navigation et la page peuvent toutes deux demander l'utilisateur courant
// sans déclencher deux lectures de session. Ce n'est pas un état applicatif
// en mémoire : rien ne survit d'une requête à l'autre.
export const utilisateurCourant = cache(async () => {
  // headers() est asynchrone depuis Next 15, comme params.
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});
/** L'acteur courant (ou null si anonyme), réduit à ce dont les règles ont besoin. */
export async function acteurCourant(): Promise<Acteur | null> {
  const user = await utilisateurCourant();
  // Le cast est sûr : la colonne est un enum PostgreSQL, elle ne peut contenir que ces 3 valeurs.
  return user ? { id: user.id, role: user.role as Role } : null;
}

/** Authentification obligatoire : un anonyme est redirigé vers /login (307). */
export async function exigerUtilisateur(): Promise<Acteur> {
  const acteur = await acteurCourant();
  if (!acteur) redirect("/login");
  return acteur;
}