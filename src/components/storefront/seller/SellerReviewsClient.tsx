'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';
import { StarRating } from '../StarRating';

export function SellerReviewsClient() {
  const utils = trpc.useUtils();
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const { data, isLoading } = trpc.review.listForMyFarm.useQuery({
    unansweredOnly,
    page: 1,
    limit: 50,
  });

  return (
    <Card>
      <label className="mb-4 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={unansweredOnly}
          onChange={(e) => setUnansweredOnly(e.target.checked)}
          className="accent-green-600"
        />
        Sans réponse uniquement
      </label>
      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-500">Chargement…</p>
      ) : !data?.items.length ? (
        <p className="py-12 text-center text-sm text-gray-500">Aucun avis</p>
      ) : (
        <ul className="space-y-4">
          {data.items.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-800">
                  {r.productName}{' '}
                  <span className="text-sm font-normal text-gray-500">
                    — {r.buyerName} · {r.orderNumber}
                  </span>
                </p>
                <StarRating value={r.rating} size="sm" />
              </div>
              {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
              {r.sellerResponse ? (
                <p className="mt-3 rounded-lg border-l-4 border-green-500 bg-green-50 p-3 text-sm text-gray-700">
                  {r.sellerResponse}
                </p>
              ) : (
                <RespondForm id={r.id} onDone={() => utils.review.listForMyFarm.invalidate()} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RespondForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState('');
  const respond = trpc.review.respondAsSeller.useMutation({ onSuccess: onDone });
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm font-medium text-green-700 hover:underline"
      >
        Répondre
      </button>
    );
  }
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        respond.mutate({ id, response });
      }}
    >
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={2}
        aria-label="Votre réponse"
        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
      />
      {respond.error && <p className="text-sm text-red-700">{respond.error.message}</p>}
      <button
        type="submit"
        disabled={respond.isPending}
        className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        Publier la réponse
      </button>
    </form>
  );
}
