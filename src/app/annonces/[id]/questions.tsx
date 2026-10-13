import { FormulaireTexte } from "@/components/formulaire-texte";
import { listerQuestions } from "@/lib/annonces";
import { formatDate } from "@/lib/format";
import { repondreQuestion } from "../actions";

type Props = { annonceId: number; peutRepondre: boolean };

export async function Questions({ annonceId, peutRepondre }: Props) {
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
          ) : peutRepondre ? (
            // Affiché seulement à l'agent propriétaire / admin. Ce n'est qu'un confort :
            // la vraie protection est dans repondreQuestion.
            <div className="mt-3">
              <FormulaireTexte
                action={repondreQuestion}
                nom="reponse"
                libelle="Votre réponse"
                bouton="Répondre"
                caches={{ questionId: q.id }}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm italic text-gray-400">En attente de réponse</p>
          )}
        </li>
      ))}
    </ul>
  );
}