"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProfileReview,
  getProfileReviews,
  type ProfileReviewResponse,
} from "@/lib/api/profile";

interface ProfileReviewsTabProps {
  profileId: string;
}

function formatReviewerName(review: ProfileReviewResponse) {
  const fullName =
    `${review.reviewerFirstName} ${review.reviewerLastName}`.trim();
  return fullName || "Unknown user";
}

export function ProfileReviewsTab({ profileId }: ProfileReviewsTabProps) {
  const { userId, accessToken } = useAuth();
  const [reviews, setReviews] = useState<ProfileReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProfileReviews(profileId);
        if (mounted) {
          setReviews(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load reviews",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [profileId]);

  const handleDelete = async (reviewId: string) => {
    if (!accessToken) {
      setError("You must be signed in to remove a review.");
      return;
    }

    setDeletingReviewId(reviewId);
    setError(null);

    try {
      await deleteProfileReview(accessToken, reviewId);
      setReviews((current) =>
        current.filter((review) => review.id !== reviewId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm p-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Reviews</h2>

      {loading && (
        <div className="py-10 text-center text-gray-500">
          Loading reviews...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <p>No reviews yet</p>
          <p className="mt-2 text-sm">Closed-deal reviews will show up here.</p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwnReview =
              !!userId &&
              review.reviewerId.toLowerCase() === userId.toLowerCase();

            return (
              <article
                key={review.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                      <Image
                        src={
                          review.reviewerProfileImagePath ||
                          "/images/default-avatar-icon.jpg"
                        }
                        alt={formatReviewerName(review)}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {formatReviewerName(review)}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.stars
                                ? "fill-[#14b8a6] text-[#14b8a6]"
                                : "text-gray-300"
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="ml-1">{review.stars}/5</span>
                      </div>
                    </div>
                  </div>

                  {isOwnReview && (
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingReviewId === review.id}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingReviewId === review.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  )}
                </div>

                {review.description && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">
                    {review.description}
                  </p>
                )}

                <p className="mt-3 text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
