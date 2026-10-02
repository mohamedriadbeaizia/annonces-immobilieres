import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";

// cache() de React : mémoïsation LE TEMPS D'UNE REQUÊTE uniquement.
// La navigation et la page peuvent toutes deux demander l'utilisateur courant
// sans déclencher deux lectures de session. Ce n'est pas un état applicatif
// en mémoire : rien ne survit d'une requête à l'autre.
export const utilisateurCourant = cache(async () => {
  // headers() est asynchrone depuis Next 15, comme params.
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});
