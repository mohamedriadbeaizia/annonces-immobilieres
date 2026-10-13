import Image from "next/image";
import { supprimerPhoto } from "./photos-actions";

type Props = { titre: string; photos: { id: number; url: string }[] };

// Composant SERVEUR : la suppression est un simple <form>, pas de JS client.
export function ListePhotos({ titre, photos }: Props) {
  if (photos.length === 0) {
    return <p className="text-sm text-gray-500">Aucune photo pour le moment.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p, i) => (
        <li key={p.id} className="space-y-2">
          <div className="relative aspect-video overflow-hidden rounded bg-gray-100">
            <Image
              src={p.url}
              alt={`Photo ${i + 1} : ${titre}`}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          </div>
          <form action={supprimerPhoto}>
            <input type="hidden" name="photoId" value={p.id} />
            <button type="submit" className="text-sm text-red-700 hover:underline">
              Supprimer
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}