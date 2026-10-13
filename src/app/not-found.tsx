import Link from "next/link";

// Page 404 de toute l'application : id inexistant, id non numérique,
// brouillon d'un autre, annonce d'un autre agent en édition.
export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-5xl font-bold text-gray-300">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-gray-600">
        Cette annonce n&apos;existe pas, n&apos;est plus publiée, ou vous n&apos;y avez pas accès.
      </p>
      <Link href="/annonces" className="mt-6 inline-block rounded bg-gray-900 px-4 py-2 text-white">
        Retour aux annonces
      </Link>
    </main>
  );
}