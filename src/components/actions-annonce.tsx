import Link from "next/link";
import { changerPublication, supprimerAnnonce } from "@/app/annonces/actions";

type Props = { annonce: { id: number; statutPublication: "BROUILLON" | "PUBLIEE" } };

// Composant SERVEUR : de simples <form> qui appellent les Server Actions, pas de JS client.
// L'id passe dans un champ caché : il est donc modifiable par le client.
// C'est voulu, c'est ce qui permet de faire le test IDOR à l'étape 7.
export function ActionsAnnonce({ annonce }: Props) {
  const publiee = annonce.statutPublication === "PUBLIEE";

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Link href={`/annonces/${annonce.id}/edit`} className="rounded border px-3 py-1 hover:bg-gray-100">
        Modifier
      </Link>

      <form action={changerPublication}>
        <input type="hidden" name="id" value={annonce.id} />
        <input type="hidden" name="publier" value={publiee ? "false" : "true"} />
        <button type="submit" className="rounded border px-3 py-1 hover:bg-gray-100">
          {publiee ? "Dépublier" : "Publier"}
        </button>
      </form>

      <form action={supprimerAnnonce}>
        <input type="hidden" name="id" value={annonce.id} />
        <button
          type="submit"
          className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
        >
          Supprimer
        </button>
      </form>
    </div>
  );
}