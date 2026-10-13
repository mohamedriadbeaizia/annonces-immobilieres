import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnnonceModifiable } from "@/lib/annonces";
import { IdAnnonce } from "@/lib/schemas";
import { exigerUtilisateur } from "@/lib/session";
import { modifierAnnonce } from "../../actions";
import { FormulaireAnnonce } from "../../formulaire-annonce";
import { FormulairePhotos } from "../../formulaire-photos";
import { ListePhotos } from "../../liste-photos";

type Props = { params: Promise<{ id: string }> };

export default async function ModifierAnnoncePage({ params }: Props) {
  const acteur = await exigerUtilisateur(); // anonyme → 307 vers /login

  const { id } = await params;
  const parsed = IdAnnonce.safeParse(id);
  if (!parsed.success) notFound();

  // Non propriétaire → null → 404 : on ne révèle même pas que l'annonce existe.
  const annonce = await getAnnonceModifiable(parsed.data, acteur);
  if (!annonce) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Modifier l&apos;annonce</h1>
        <Link href={`/annonces/${annonce.id}`} className="text-sm underline">
          Voir l&apos;annonce
        </Link>
      </div>

      <FormulaireAnnonce
        action={modifierAnnonce}
        annonceId={annonce.id}
        initial={{
          titre: annonce.titre,
          description: annonce.description,
          typeBien: annonce.typeBien,
          statutBien: annonce.statutBien,
          prix: String(annonce.prix),
          dateDisponibilite: annonce.dateDisponibilite.toISOString().slice(0, 10),
        }}
      />

      <section className="space-y-4 border-t pt-8">
        <h2 className="text-xl font-semibold">Photos</h2>
        <ListePhotos titre={annonce.titre} photos={annonce.photos} />
        <FormulairePhotos annonceId={annonce.id} />
      </section>
    </main>
  );
}