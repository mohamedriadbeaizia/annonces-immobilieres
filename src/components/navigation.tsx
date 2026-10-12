import Link from "next/link";
import { deconnecter } from "@/app/(auth)/actions";
import { utilisateurCourant } from "@/lib/session";

const LIBELLE_ROLE = { USER: "Utilisateur", AGENT: "Agent", ADMIN: "Admin" } as const;

export async function Navigation() {
  const user = await utilisateurCourant();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/annonces" className="text-lg font-bold">
          Immobilier
        </Link>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
                   <Link href="/favoris" className="hover:underline">
                  Favoris
                    </Link>
                 {(user.role === "AGENT" || user.role === "ADMIN") && (
              <>
                <Link href="/mes-annonces" className="hover:underline">
                  {user.role === "ADMIN" ? "Gestion" : "Mes annonces"}
                </Link>
                <Link href="/annonces/new" className="hover:underline">
                  Nouvelle annonce
                </Link>
              </>
            )}
            <span>{user.name}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
              {LIBELLE_ROLE[user.role as keyof typeof LIBELLE_ROLE] ?? user.role}
            </span>
            <form action={deconnecter}>
              <button type="submit" className="underline hover:no-underline">
                Déconnexion
              </button>
            </form>
          </div>
        ) : (
          <div className="flex gap-3 text-sm">
            <Link href="/login" className="hover:underline">Connexion</Link>
            <Link href="/register" className="rounded bg-gray-900 px-3 py-1 text-white">
              Inscription
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}