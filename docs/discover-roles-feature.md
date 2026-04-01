# Discover Roles
**Status:** Active (mobile + backend contract integrated)

## Scope

- Screen: `DiscoverRoles`
- API: `GET /api/astrology/discover-roles`
- Data source: curated O*NET role catalog + manual product/tech role extensions

## Backend Storage

### `discover_role_catalog`

Role dictionary used by recommendations and search.

Fields:

- `slug` (unique)
- `title`
- `domain`
- `majorGroup` (SOC major group prefix when available)
- `onetCode` (unique when present)
- `source` (`onetonline` | `manual`)
- `sourceUrl`
- `aliases[]`
- `keywords[]`
- `tags[]`
- `traitWeights` (`analytical`, `creative`, `leadership`, `technical`, `people`, `business`, `operations`, `detail`, `research`, `communication`)
- `active`
- `createdAt`, `updatedAt`

Indexes:

- unique: `slug`
- unique partial: `onetCode` (only string values)
- query helpers: `(active, title)`, `(domain, title)`

### `discover_role_recommendations`

Per-user cached recommendation snapshots by profile and algorithm version.

Fields:

- `userId`
- `profileHash`
- `algorithmVersion`
- `traitProfile` (same 10 trait vector)
- `signals[]`
- `recommended[]` (`roleSlug`, `score`, `reason`, `tags[]`)
- `generatedAt`
- `createdAt`, `updatedAt`

Indexes:

- unique: `(userId, profileHash, algorithmVersion)`
- helper: `(userId, updatedAt desc)`

## Recommendation Algorithm (v1)

1. Build user trait vector from natal chart:
   - ASC/MC sign bonuses
   - house activity bonuses
   - planet placement bonuses
2. Normalize trait vector.
3. Compute role fit score as weighted dot product between user traits and `roleCatalog.traitWeights`.
4. Produce:
   - top `recommended` roles (score + reason + tags)
   - `search` roles for query (runtime match ranking + same score model)

Notes:

- Dropdown data is computed in runtime from `discover_role_catalog`; no separate dropdown table is used.
- Recommendations are cached in `discover_role_recommendations` and can be refreshed with `refresh=true`.
