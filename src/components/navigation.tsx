import Link from "next/link";
import { deconnecter } from "@/app/(auth)/actions";
import { utilisateurCourant } from "@/lib/session";

const LIBELLE_ROLE = { USER: "Utilisateur", AGENT: "Agent", ADMIN: "Admin" } as const;

export async function Navigation() {
  const user = await utilisateurCourant();
  const role = user?.role as keyof typeof LIBELLE_ROLE | undefined;
  const gestionnaire = role === "AGENT" || role === "ADMIN";

  return (
    <header className="bg-manche text-ecume">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3"
      >
        <Link href="/annonces" className="font-titre text-2xl font-bold tracking-wide">
          Port d&apos;attache
        </Link>

        {user ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/favoris" className="hover:text-sable">
              Favoris
            </Link>
            {gestionnaire && (
              <>
                <Link href="/mes-annonces" className="hover:text-sable">
                  {role === "ADMIN" ? "Gestion" : "Mes annonces"}
                </Link>
                <Link href="/annonces/new" className="btn btn-primaire">
                  Nouvelle annonce
                </Link>
              </>
            )}
            <span className="flex items-center gap-2 border-l border-white/20 pl-5">
              {user.name}
              <span className="badge bg-sable text-manche">{role ? LIBELLE_ROLE[role] : user.role}</span>
            </span>
            <form action={deconnecter}>
              <button type="submit" className="underline-offset-4 hover:underline">
                Déconnexion
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="hover:text-sable">
              Connexion
            </Link>
            <Link href="/register" className="btn btn-primaire">
              Créer un compte
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}