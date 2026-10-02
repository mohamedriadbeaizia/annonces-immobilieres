import { listerQuestions } from "@/lib/annonces";
import { formatDate } from "@/lib/format";

export async function Questions({ annonceId }: { annonceId: number }) {
  const questions = await listerQuestions(annonceId);

  if (questions.length === 0) {
    return <p className="text-gray-500">Aucune question pour le moment.</p>;
  }

  return (
    <ul className="space-y-4">
      {questions.map((q) => (
        <li key={q.id} className="rounded-lg border p-4">
          <p className="font-medium">{q.contenu}</p>
          <p className="text-xs text-gray-500">
            {q.auteur.name} · {formatDate(q.createdAt)}
          </p>
          {q.reponse ? (
            <p className="mt-3 border-l-4 border-gray-300 pl-3">{q.reponse}</p>
          ) : (
            <p className="mt-3 text-sm italic text-gray-400">En attente de réponse</p>
          )}
        </li>
      ))}
    </ul>
  );
}