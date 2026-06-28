/**
 * Recommendation / ranking API (FastAPI) — separate from Node backend (`VITE_API_URL`).
 * Set `VITE_RECOMMENDATION_API_URL` in `.env` (e.g. http://localhost:8088).
 * Failures are logged only so the main app keeps working if this service is down.
 */

const base = () => {
  const raw =
    import.meta.env.VITE_RECOMMENDATION_API_URL || "";
  return String(raw)
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/$/, "");
};

const api = (path: string) => `${base()}/api/v1${path}`;

async function postEvent(
  path: string,
  body: object,
): Promise<{ recorded: boolean; is_new: boolean; reason?: string | null } | null> {
  try {
    const res = await fetch(api(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[recommendation-engine]", path, res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (e) {
    console.warn("[recommendation-engine] unreachable", path, e);
    return null;
  }
}

/** product_categories.id (e.g. cat_001) — not the numeric functionality id */
export function trackCategoryClick(userId: string, categoryId: string) {
  if (!userId?.trim() || !categoryId?.trim()) return;
  void postEvent("/events/category-click", {
    user_id: userId,
    category_id: categoryId,
  });
}

/** expert_functionality_options.id (integer) — browse / filter by area */
export function trackFunctionalityClick(userId: string, functionalityId: number) {
  if (!userId?.trim() || !Number.isFinite(functionalityId) || functionalityId < 1) return;
  void postEvent("/events/functionality-click", {
    user_id: userId,
    functionality_id: Math.floor(functionalityId),
  });
}

/**
 * Logged-in browse: functionality click + product category click (from seeker profile) when available.
 */
export async function trackBrowseEngagement(functionalityId: number) {
  const raw = localStorage.getItem("user");
  if (!raw) return;
  try {
    const u = JSON.parse(raw);
    const uid = u.user_id || u.id;
    const token = u.token || u.accessToken;
    if (!uid || !Number.isFinite(functionalityId) || functionalityId < 1) return;
    trackFunctionalityClick(String(uid), functionalityId);
    const viteUrl = import.meta.env.VITE_API_URL;
    if (!token || !viteUrl) return;
    const res = await fetch(
      `${viteUrl}/api/profiles/seeker/${encodeURIComponent(uid)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return;
    const j = await res.json();
    const pc = j?.data?.product_category_id;
    if (pc) trackCategoryClick(String(uid), String(pc));
  } catch {
    /* ignore */
  }
}

/** expert users.id (UUID) for the profile being viewed */
export function trackProfileView(userId: string, expertUserId: string) {
  if (!userId?.trim() || !expertUserId?.trim()) return;
  void postEvent("/events/profile-view", {
    user_id: userId,
    expert_id: expertUserId,
  });
}

/** After a booking is created — refreshes stored view→book conversion stats */
export function trackExpertBooked(seekerId: string, expertUserId: string) {
  if (!seekerId?.trim() || !expertUserId?.trim()) return;
  void postEvent("/events/expert-booked", {
    user_id: seekerId,
    expert_id: expertUserId,
  });
}

/** Distinct seekers who viewed any expert mapped to each functionality */
/** expert users.id (UUID) — unique seekers who opened that expert's profile (recommendation-engine) */
export async function fetchExpertProfileViewCounts(
  expertUserIds: string[],
): Promise<Record<string, number>> {
  const uniq = [
    ...new Set(
      expertUserIds.map((id) => String(id).trim()).filter(Boolean),
    ),
  ];
  const out: Record<string, number> = {};
  if (!uniq.length) return out;
  try {
    const settled = await Promise.all(
      uniq.map(async (id) => {
        try {
          const res = await fetch(
            `${base()}/api/v1/stats/expert/${encodeURIComponent(id)}/views`,
          );
          if (!res.ok) return [id, 0] as const;
          const j = (await res.json()) as {
            unique_viewers_mysql?: number;
            unique_viewers_redis?: number | null;
          };
          const mysql = j.unique_viewers_mysql ?? 0;
          const redis = j.unique_viewers_redis;
          const n =
            redis != null && typeof redis === "number"
              ? Math.max(mysql, redis)
              : mysql;
          return [id, n] as const;
        } catch {
          return [id, 0] as const;
        }
      }),
    );
    for (const [id, n] of settled) out[id] = n;
  } catch {
    for (const id of uniq) out[id] = 0;
  }
  return out;
}

export async function fetchFunctionalityViewsSummary(
  functionalityIds: number[],
): Promise<Record<number, number>> {
  const uniq = [...new Set(functionalityIds)].filter((n) => Number.isFinite(n) && n >= 1);
  if (!uniq.length) return {};
  const ids = uniq.join(",");
  try {
    const res = await fetch(
      `${base()}/api/v1/stats/functionality/views-summary?ids=${encodeURIComponent(ids)}`,
    );
    if (!res.ok) return {};
    const rows = (await res.json()) as {
      functionality_id: number;
      total_profile_views: number;
    }[];
    const out: Record<number, number> = {};
    for (const r of rows) out[r.functionality_id] = r.total_profile_views;
    return out;
  } catch {
    return {};
  }
}

export type RankedExpert = {
  position: number;
  expert_id: string;
  display_name: string;
  rank_score: number;
  components: Record<string, unknown>;
};

export async function fetchRankedExperts(options?: {
  categoryId?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (options?.categoryId) q.set("category_id", options.categoryId);
  if (options?.limit != null) q.set("limit", String(options.limit));
  const res = await fetch(api(`/ranking/experts?${q}`));
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<RankedExpert[]>;
}
