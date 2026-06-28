# Recommendation engine

FastAPI service that records **unique** dashboard interactions (category clicks and expert profile views), persists them in **MySQL**, uses **Redis** sets for fast deduplication, and exposes a **weighted ranking** API for experts.

## Behaviour

| Event | Rule |
|--------|------|
| Category click | At most **one** counted row per `(user_id, category_id)` — repeat clicks from the same user do not increase counts. |
| Profile view | At most **one** counted row per `(user_id, expert_id)` — repeat views do not increase counts. |
| Multiple users | Each distinct user increments the unique totals (e.g. two users ⇒ count 2). |

**Redis** stores per-entity sets (`category_clicks:users:{category_id}`, `expert_views:users:{expert_id}`) so `SADD` is O(1) membership and duplicate clicks short-circuit before heavy work. **MySQL** holds the authoritative rows (`category_clicks`, `expert_views`, totals tables) and aggregate counters. If Redis is empty but MySQL already has the pair, `INSERT IGNORE` prevents double-counting and the service reconciles Redis (see `app/services/interactions.py`).

## Setup

1. **MySQL** — use the same database as the main app (`users`, `product_categories`, `expert_profiles`, `bookings`, … must exist first). In this repo, `src/database/schema.sql` creates **`exp`** — recommendation SQL files use `USE exp;` (change if your DB name differs).

   **MySQL Workbench (laptop):** connect to **Local instance 3306** → select schema **`exp`** → *File → Open SQL Script* → open `schema/001_recommendation_tables.sql` → lightning bolt (Execute) → repeat for `002_search_and_behavior.sql`. No Docker MySQL required if you already run MySQL locally.

   ```bash
   mysql -h 127.0.0.1 -P 3307 -u root -p < schema/001_recommendation_tables.sql
   mysql -h 127.0.0.1 -P 3307 -u root -p < schema/002_search_and_behavior.sql
   mysql -h 127.0.0.1 -P 3307 -u root -p < schema/004_functionality_clicks.sql
   mysql -h 127.0.0.1 -P 3307 -u root -p < schema/005_seeker_conversion_stats.sql
   ```

   **Windows PowerShell** does not support `<` redirection. Use either:

   ```powershell
   cmd /c "mysql -h 127.0.0.1 -P 3307 -u root -p < schema\001_recommendation_tables.sql"
   cmd /c "mysql -h 127.0.0.1 -P 3307 -u root -p < schema\002_search_and_behavior.sql"
   ```

   Or pipe the file:

   ```powershell
   Get-Content schema\001_recommendation_tables.sql -Raw | mysql -h 127.0.0.1 -P 3307 -u root -p
   Get-Content schema\002_search_and_behavior.sql -Raw | mysql -h 127.0.0.1 -P 3307 -u root -p
   ```

   **No `mysql` on Windows?** Use the client inside the Docker container (default password `rootpass`, DB `exp`):

   ```powershell
   cd ai-services\recommendation-engine
   .\apply-schema-docker.ps1
   ```

   Or one-liners:

   ```powershell
   Get-Content schema\001_recommendation_tables.sql -Raw | docker exec -i recommendation-engine-mysql mysql -uroot -prootpass exp
   Get-Content schema\002_search_and_behavior.sql -Raw | docker exec -i recommendation-engine-mysql mysql -uroot -prootpass exp
   ```

   Upgrading from older `rec_*` table names? Run `schema/003_rename_legacy_rec_tables.sql` once (only if those legacy tables exist and the new names do not).

   Optional (faster last-24h booking counts at scale): `CREATE INDEX idx_bookings_expert_created ON bookings (expert_id, created_at);`

2. **Docker: MySQL + Redis** — from this folder:

   ```bash
   docker compose up -d
   ```

   - MySQL is exposed on **host port 3307** by default (container `3306`) so it does not fight a local MySQL on `3306`.
   - Root password defaults to `rootpass` (override with `MYSQL_ROOT_PASSWORD` in the environment).
   - After MySQL is healthy, import your **main** app schema (this repo: `src/database/schema.sql` → database **`exp`**) or your `MYSQL_DATABASE`, then run `001` and `002`. If your DB name differs, change the `USE …` line in each SQL file.

3. **Environment** — copy `.env.example` to `.env`. Match `MYSQL_PORT` / `MYSQL_PASSWORD` / `MYSQL_DATABASE` to Docker or your existing server. Set `REDIS_URL` (e.g. `redis://127.0.0.1:6379/0`).

4. **Run API**:

   ```bash
   cd ai-services/recommendation-engine
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8088 --reload
   ```

Open `http://localhost:8088/docs` for OpenAPI.

## Expert ↔ category mapping

Ranking can boost experts for a selected category when rows exist in `expert_category_map` (see `POST /api/v1/admin/expert-category`). Map each expert’s `users.id` to `product_categories.id` values your product uses (aligned with `src/database/schema.sql`).

## Ranking model (high level)

Scores combine normalized signals:

- **Demand:** bookings in the last 24 hours (`bookings`), conversion-style signal = bookings ÷ unique profile views
- **Engagement:** unique profile views (`expert_view_totals`)
- **Category:** relevance when `category_id` is passed; popularity from category clicks
- **Personalization:** when `user_id` is passed on `GET /ranking/experts`, experts with categories overlapping `category_clicks` for that user get a boost
- **Search history:** `POST /events/search-query` stores rows in `search_history`
- **Acceptance** ratio from `bookings` (session outcomes)
- **Rating** from `session_feedback` (seeker ratings)
- **Availability:** rows in `expert_availability` (slot count + boost when any slot exists)
- **Price** — lower price scores higher (min–max normalized within the candidate set)

Weights are env-driven (`WEIGHT_*` in `.env.example`). Tune them per product.

## HTTP API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/events/category-click` | Record unique **product category** click (`product_categories.id`, e.g. `cat_001`) |
| `POST` | `/api/v1/events/functionality-click` | Record unique **browse area** click (`expert_functionality_options.id`) |
| `POST` | `/api/v1/events/expert-booked` | After Node creates a booking — refreshes stored **view→book conversion** for the seeker |
| `POST` | `/api/v1/events/profile-view` | Record unique profile view |
| `GET` | `/api/v1/stats/user/{user_id}/conversion-rollup` | Stored `unique_experts_viewed`, `unique_experts_booked`, `conversion_rate` |
| `GET` | `/api/v1/stats/functionality/views-summary?ids=23,24` | Distinct seekers who viewed experts in those functionalities |
| `POST` | `/api/v1/events/search-query` | Store search query / problem / keywords (`search_history`) |
| `GET` | `/api/v1/ranking/experts?category_id=&user_id=&limit=` | Ranked list; `user_id` enables personalization |
| `GET` | `/api/v1/stats/user/{user_id}/behavior` | Viewed vs booked counts, conversion, search/category stats |
| `GET` | `/api/v1/stats/category/{category_id}` | Unique clickers (MySQL + optional Redis SCARD) |
| `GET` | `/api/v1/stats/expert/{expert_id}/views` | Unique viewers for an expert |
| `POST` | `/api/v1/admin/expert-category` | Map expert to category |

## Frontend integration flow

1. **Auth** — obtain the logged-in seeker’s `user_id` (same `users.id` UUID string the backend uses).

2. **Category tile / link** — on first user gesture (click) on a category card, call:

   ```http
   POST /api/v1/events/category-click
   Content-Type: application/json

   {"user_id": "<seeker_uuid>", "category_id": "<product_categories.id>"}
   ```

   Call once per navigation (idempotent: repeats return `recorded: false`). You may debounce in UI for UX, but duplicates are safe server-side.

3. **Expert card / profile route** — when the user opens an expert profile view, call:

   ```http
   POST /api/v1/events/profile-view
   Content-Type: application/json

   {"user_id": "<seeker_uuid>", "expert_id": "<expert_users.id>"}
   ```

   Fire from the profile page mount or “view” analytics hook; repeats are deduped.

4. **Ranked listing** — dashboard lists load ranked experts:

   ```http
   GET /api/v1/ranking/experts?category_id=<optional>&limit=24
   ```

   Use the returned `position` field for ordering (1 = top). Pass `category_id` when the user is browsing within a category context.

5. **CORS** — the app allows all origins by default; restrict `allow_origins` in production in `app/main.py`.

## Operations notes

- **Scaling reads**: add read replicas for MySQL; keep Redis for hot-path dedup; optionally cache `GET /ranking/experts` behind CDN or a short-TTL Redis key if needed.
- **Redis rebuild**: if Redis is flushed, uniqueness is still enforced in MySQL; backfill sets from `category_clicks` / `expert_views` (`SADD` each `user_id` into `category_clicks:users:{category_id}` and `expert_views:users:{expert_id}`).
