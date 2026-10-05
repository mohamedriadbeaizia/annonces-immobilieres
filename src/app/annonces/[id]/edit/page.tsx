import { notFound } from "next/navigation";
import { getAnnonceModifiable } from "@/lib/annonces";
import { IdAnnonce } from "@/lib/schemas";
import { exigerUtilisateur } from "@/lib/session";
import { modifierAnnonce } from "../../actions";
import { FormulaireAnnonce } from "../../formulaire-annonce";

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Modifier l&apos;annonce</h1>
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
    </main>
  );
}