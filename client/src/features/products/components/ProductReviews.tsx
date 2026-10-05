import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";
import { reviewService } from "../services/reviewService";

interface ProductReviewsProps {
  productId: string;
  average: number;
  count: number;
}

export const ProductReviews = ({
  productId,
  average,
  count,
}: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const queryKey = ["product-reviews", productId];

  const { data: reviews = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => reviewService.getProductReviews(productId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      reviewService.createReview(productId, rating, comment.trim()),
    onSuccess: async () => {
      setComment("");
      setRating(5);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["product", productId] }),
      ]);
      toast.success("Yorumunuz eklendi.");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Yorum eklenemedi.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (comment.trim().length < 3) {
      toast.error("Yorum en az 3 karakter olmalıdır.");
      return;
    }
    createMutation.mutate();
  };

  return (
    <section className="mx-auto mt-12 max-w-6xl border-t border-gray-200 px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
        <div>
          <span className="text-xs font-bold uppercase text-emerald-800">
            MÜŞTERİ YORUMLARI
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Deneyimler
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <Star size={20} className="fill-amber-400 text-amber-400" />
            <span className="text-2xl font-semibold text-gray-900">
              {average.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({count} değerlendirme)
            </span>
          </div>
          {user?.role === "customer" && (
            <form className="mt-7 space-y-3" onSubmit={handleSubmit}>
              <label
                className="block text-sm font-semibold text-gray-800"
                htmlFor="product-review"
              >
                Ürün hakkında yorumun
              </label>
              <div
                className="flex items-center gap-1"
                aria-label={`Seçilen puan ${rating} / 5`}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} yıldız`}
                    className="rounded p-1 text-amber-400 hover:bg-amber-50"
                  >
                    <Star
                      size={19}
                      className={value <= rating ? "fill-current" : ""}
                    />
                  </button>
                ))}
              </div>
              <textarea
                id="product-review"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Ürünü nasıl buldun?"
                className="w-full rounded border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-emerald-700 focus:outline-none"
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex min-h-10 items-center gap-2 rounded bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
              >
                <MessageSquareText size={16} />
                {createMutation.isPending ? "Gönderiliyor..." : "Yorumu gönder"}
              </button>
              <p className="text-xs text-gray-500">
                Yorumlar teslim edilmiş siparişler için açıktır.
              </p>
            </form>
          )}
        </div>

        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {isLoading ? (
            <p className="py-6 text-sm text-gray-500">Yorumlar yükleniyor...</p>
          ) : reviews.length === 0 ? (
            <p className="py-6 text-sm text-gray-500">
              Henüz yorum yok. Bu ürün için ilk değerlendirme burada görünecek.
            </p>
          ) : (
            reviews.map((review) => (
              <article key={review._id} className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {review.user?.name || "Müşteri"}
                  </h3>
                  <time
                    className="text-xs text-gray-500"
                    dateTime={review.createdAt}
                  >
                    {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                  </time>
                </div>
                <div
                  className="mt-2 flex gap-0.5"
                  aria-label={`${review.rating} / 5 yıldız`}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={14}
                      className={
                        value <= review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {review.comment}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
