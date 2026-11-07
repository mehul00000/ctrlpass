"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Star, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import type { MediaType } from "@/lib/persistence";
import { useCurrentUser } from "@/lib/user-context";
import type { ReviewItem } from "@/lib/persistence";
import { EmptyState } from "@/components/States";

export function ReviewsSection({ tmdbId, mediaType }: { tmdbId: number; mediaType: MediaType }) {
  const { user } = useCurrentUser();
  const reviews = (useQuery(api.userData.listReviews, { mediaType, tmdbId }) ?? []) as ReviewItem[];
  const createReview = useMutation(api.userData.createReview);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (rating < 1) {
      setError("Pick a rating first.");
      return;
    }
    if (text.trim().length < 3) {
      setError("Write a few words about it.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createReview({ tmdbId, mediaType, rating, reviewText: text.trim() });
      setText("");
      setRating(0);
    } catch {
      setError("Could not save your review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="section-title mb-5">User Reviews</h2>

      {/* Write */}
      <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-300">Your rating:</span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                aria-label={`${i + 1} stars`}
                className="transition-transform hover:scale-125"
              >
                <Star
                  className={clsx(
                    "h-4 w-4",
                    i < rating ? "fill-brand-peach text-brand-peach" : "text-neutral-600"
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && <span className="text-sm font-semibold text-brand-peach">{rating}/10</span>}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you think? (no spoilers!)"
          rows={3}
          className="input-dark mt-3 resize-none"
        />
        {error && <p className="mt-2 text-sm text-brand-peach">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button onClick={submit} disabled={submitting} className="btn-primary !py-2 disabled:opacity-50">
            {submitting ? "Posting…" : "Post Review"}
          </button>
        </div>
      </div>

      {/* List */}
      {reviews === undefined ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Be the first to share what you thought about this title."
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-deep">
                    <UserIcon className="h-4 w-4 text-brand-peach" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.userName}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-sm font-semibold text-brand-peach">
                  <Star className="h-3.5 w-3.5 fill-brand-peach" /> {r.rating}/10
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">{r.reviewText}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
