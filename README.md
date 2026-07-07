# Insighta Labs+ Backend

A secure RESTful API built with Express and TypeScript that serves as the backend for Insighta Labs+ — a profile intelligence platform with GitHub OAuth authentication, role-based access control, natural language search, and multi-interface support (API, CLI, web portal).

## Tech Stack

- Node.js + Express 5
- TypeScript
- MongoDB Atlas + Mongoose
- Passport.js (GitHub OAuth strategy)
- JSON Web Tokens (jsonwebtoken)
- Axios (external API calls)
- uuidv7 (time-ordered unique IDs)
- express-rate-limit
- Morgan (request logging)
- tsx + nodemon (dev runtime)

## System Architecture

Insighta Labs+ is a three-part system:

- **Backend API** (this repo) — the single source of truth. Handles authentication, authorization, data storage, and all business logic. Both the CLI and web portal communicate exclusively with this API.
- **CLI tool** ([insighta-cli repo](https://github.com/fikayosalu/insighta-cli)) — a globally installable command-line tool for developers and power users. Authenticates via GitHub OAuth with PKCE. Stores tokens locally at `~/.insighta/credentials.json`.
- **Web portal** — a browser-based interface for non-technical users. Authenticates via GitHub OAuth with HTTP-only cookies.

All three interfaces share the same backend, the same database, and the same authentication system. A profile created via the CLI appears immediately in the web portal and vice versa.

## Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/fikayosalu/insighta-backend.git
npm install
```

Create a `.env` file in the project root:

```env
DATABASE=mongodb+srv://your_user:your_password@cluster.mongodb.net/your_db_name
PORT=4000
JWT_SECRET=your_long_random_secret_string
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_CLI_CLIENT_ID=your_github_cli_oauth_app_client_id
GITHUB_CLI_CLIENT_SECRET=your_github_cli_oauth_app_client_secret
```

Two GitHub OAuth Apps are required — one for the browser flow (callback: `http://localhost:4000/auth/github/callback`) and one for the CLI flow (callback: `http://localhost:9876/callback`). Create both at GitHub → Settings → Developer settings → OAuth Apps.

Start the dev server:

```bash
npm run dev
```

Build and run for production:

```bash
npm run build
npm start
```

## Authentication Flow

### Browser OAuth Flow

1. User visits `GET /auth/github`
2. Backend redirects to GitHub's authorization page via Passport.js
3. User logs into GitHub and authorizes the app
4. GitHub redirects to `GET /auth/github/callback` with an authorization code
5. Passport exchanges the code with GitHub using the client secret
6. Backend receives the user's GitHub profile (username, email, avatar)
7. Backend creates the user in the database (first login) or updates `last_login_at` (returning user)
8. Backend generates a JWT access token (3 min expiry) and refresh token (5 min expiry)
9. Refresh token is stored on the user document in the database
10. Both tokens are returned in the response

### CLI PKCE Flow

The CLI cannot use the browser flow directly because it runs on the user's machine where the client secret cannot be safely stored. PKCE (Proof Key for Code Exchange) solves this:

1. CLI generates a random `state`, `code_verifier`, and `code_challenge` (SHA-256 hash of the verifier)
2. CLI starts a temporary HTTP server on `localhost:9876`
3. CLI opens the browser to GitHub's authorization page with the `code_challenge` included
4. User logs into GitHub
5. GitHub redirects to `localhost:9876/callback` with an authorization code and state
6. CLI validates that the returned state matches the one it generated
7. CLI sends the code and `code_verifier` to `POST /auth/github/cli`
8. Backend sends the code, `code_verifier`, client ID, and client secret to GitHub
9. GitHub hashes the `code_verifier` and verifies it matches the original `code_challenge`
10. GitHub returns the user's profile info
11. Backend creates/finds the user, generates JWT tokens, and returns them
12. CLI stores the tokens locally at `~/.insighta/credentials.json`

The `code_verifier` is generated randomly each login and only exists in the CLI's memory. Even if an attacker intercepts the authorization code, they cannot exchange it without the verifier.

## Token Handling

| Token         | Expiry    | Purpose                                                                                                                       |
| ------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Access token  | 3 minutes | Sent with every API request in the `Authorization: Bearer` header. Contains the user's `id` and `role`.                       |
| Refresh token | 5 minutes | Used to obtain new access and refresh tokens when the access token expires. Sent in the request body to `POST /auth/refresh`. |

Token rotation: every time a refresh token is used, both tokens are regenerated and the old refresh token is overwritten in the database. This ensures that a stolen refresh token can only be used once — the legitimate user's next refresh invalidates the stolen copy.

On logout, the refresh token is set to `null` in the database. Even if an attacker has a copy, the database comparison (`stored_token === submitted_token`) fails because `null !== "any_token"`.

When both tokens expire, the user must re-authenticate via GitHub.

## Role Enforcement

Two roles exist:

| Role    | Permissions                                                         |
| ------- | ------------------------------------------------------------------- |
| admin   | Full access: create profiles, delete profiles, read, search, export |
| analyst | Read-only: list profiles, view profiles, search, export             |

Every new user is assigned the `analyst` role by default.

Role enforcement is handled by two middleware functions applied to every `/api/*` route:

1. `authenticate` — verifies the JWT access token, finds the user in the database, checks `is_active`, and attaches the user to `req.user`
2. `authorizeRoles(...roles)` — checks if `req.user.role` is in the list of allowed roles. Returns 403 if not.

Routes are protected like this:

```
POST   /api/profiles          → authenticate → authorizeRoles("admin")
GET    /api/profiles          → authenticate → authorizeRoles("admin", "analyst")
GET    /api/profiles/:id      → authenticate → authorizeRoles("admin", "analyst")
DELETE /api/profiles/:id      → authenticate → authorizeRoles("admin")
GET    /api/profiles/search   → authenticate → authorizeRoles("admin", "analyst")
GET    /api/profiles/export   → authenticate → authorizeRoles("admin", "analyst")
```

If a user's `is_active` field is set to `false`, all requests return `403 Forbidden` regardless of role.

## API Versioning

All profile endpoints require the `X-API-Version: 1` header. Requests without this header are rejected with `400 Bad Request`:

```json
{ "status": "error", "message": "API version header required" }
```

## Rate Limiting

| Scope                      | Limit                           |
| -------------------------- | ------------------------------- |
| Auth endpoints (`/auth/*`) | 10 requests per minute          |
| All other endpoints        | 60 requests per minute per user |

Exceeding the limit returns `429 Too Many Requests`.

## Auth Endpoints

### `GET /auth/github`

Redirects the user to GitHub's OAuth authorization page (browser flow).

### `GET /auth/github/callback`

Handles the OAuth callback from GitHub. Returns access and refresh tokens.

### `POST /auth/github/cli`

Handles the CLI's PKCE-based OAuth exchange.

Request body:

```json
{
	"code": "authorization_code_from_github",
	"code_verifier": "the_pkce_verifier_string"
}
```

Response:

```json
{
	"status": "success",
	"data": {
		"access_token": "eyJ...",
		"refresh_token": "eyJ..."
	}
}
```

### `POST /auth/refresh`

Exchanges a valid refresh token for new access and refresh tokens.

Request body:

```json
{ "refresh_token": "eyJ..." }
```

Response:

```json
{
	"status": "success",
	"access_token": "eyJ...",
	"refresh_token": "eyJ..."
}
```

### `POST /auth/logout`

Invalidates the refresh token server-side.

Request body:

```json
{ "refresh_token": "eyJ..." }
```

### `GET /auth/me`

Returns the currently authenticated user's profile. Requires `Authorization: Bearer` header.

Response:

```json
{
	"status": "success",
	"data": {
		"id": "019db9c7-...",
		"username": "fikayosalu",
		"email": "user@example.com",
		"role": "analyst",
		"avatar_url": "https://...",
		"is_active": true,
		"last_login_at": "2026-04-23T12:00:00.000Z",
		"created_at": "2026-04-23T12:00:00.000Z"
	}
}
```

## Profile Endpoints

All profile endpoints require:

- `Authorization: Bearer <access_token>` header
- `X-API-Version: 1` header

### `POST /api/profiles` (admin only)

Creates a profile by calling external APIs (Genderize, Agify, Nationalize) to enrich the data.

Request body:

```json
{ "name": "Peter Johnson" }
```

Response — `201 Created`:

```json
{
	"status": "success",
	"data": {
		"id": "019db9c7-7223-775c-9429-1ffa39f96d36",
		"name": "Peter Johnson",
		"gender": "male",
		"gender_probability": 0.95,
		"age": 28,
		"age_group": "adult",
		"country_id": "NG",
		"country_name": "Nigeria",
		"country_probability": 0.85,
		"created_at": "2026-04-23T12:00:00.000Z"
	}
}
```

### `GET /api/profiles`

Lists profiles with filtering, sorting, and pagination.

| Parameter    | Description                             | Example                 |
| ------------ | --------------------------------------- | ----------------------- |
| gender       | Filter by gender                        | `?gender=male`          |
| age_group    | Filter by age group                     | `?age_group=adult`      |
| country_name | Filter by country                       | `?country_name=Nigeria` |
| min_age      | Minimum age                             | `?min_age=20`           |
| max_age      | Maximum age                             | `?max_age=40`           |
| sort_by      | Field to sort by                        | `?sort_by=age`          |
| order        | Sort direction (asc or desc)            | `?order=desc`           |
| page         | Page number (default: 1)                | `?page=2`               |
| limit        | Results per page (default: 10, max: 50) | `?limit=20`             |

Response:

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 203,
  "total_pages": 21,
  "links": {
    "self": "/api/profiles?page=1&limit=10",
    "next": "/api/profiles?page=2&limit=10",
    "prev": null
  },
  "data": [...]
}
```

### `GET /api/profiles/:id`

Returns a single profile by UUID.

### `DELETE /api/profiles/:id` (admin only)

Deletes a profile. Returns `204 No Content`.

### `GET /api/profiles/search`

Natural language search. See the Natural Language Parsing section below.

```
GET /api/profiles/search?q=young males from nigeria
```

### `GET /api/profiles/export?format=csv`

Exports profiles as a CSV file. Supports the same filters as `GET /api/profiles`.

Response headers:

- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="profiles_<timestamp>.csv"`

CSV columns: `id, name, gender, gender_probability, age, age_group, country_id, country_name, country_probability, created_at`

## Error Responses

All errors follow this shape:

```json
{
	"status": "failed",
	"message": "..."
}
```

| Status | Condition                                                              |
| ------ | ---------------------------------------------------------------------- |
| 400    | Missing required field, invalid parameters, API version header missing |
| 401    | Missing, invalid, or expired access token                              |
| 403    | Deactivated account or insufficient role permissions                   |
| 404    | Profile not found                                                      |
| 409    | Duplicate profile name                                                 |
| 422    | Unable to interpret search query                                       |
| 429    | Rate limit exceeded                                                    |
| 500    | Server error                                                           |
| 502    | External API failure (Genderize, Agify, Nationalize)                   |

## Natural Language Parsing: Approach & Design

### Overview

The search endpoint uses a rule-based parser — no AI, no LLMs. It processes the query string through a series of regex patterns and keyword matches, extracting structured filters that map directly to MongoDB query fields.

The parser runs in a fixed order: country extraction → gender detection → age group matching → "young" keyword handling → explicit age patterns → generic "people" keyword. Each step sets a flag if it matched anything. If nothing matched by the end, the query is treated as uninterpretable.

### Supported Keywords & Filter Mappings

**Gender keywords:**

| Keywords                      | Filter             |
| ----------------------------- | ------------------ |
| male, males, man, men         | `gender: "male"`   |
| female, females, woman, women | `gender: "female"` |
| Both mentioned together       | No gender filter   |

**Age group keywords:**

| Keyword     | Filter                  |
| ----------- | ----------------------- |
| teenager(s) | `age_group: "teenager"` |
| adult(s)    | `age_group: "adult"`    |
| elderly     | `age_group: "elderly"`  |
| senior(s)   | `age_group: "senior"`   |

**"Young" keyword** (not a stored age group — maps to an age range only):

| Keyword | Filter                        |
| ------- | ----------------------------- |
| young   | `age: { $gte: 16, $lte: 24 }` |

**Explicit age patterns:**

| Pattern                      | Example             | Filter                        |
| ---------------------------- | ------------------- | ----------------------------- |
| above/over/older than [N]    | "above 30"          | `age: { $gte: 30 }`           |
| below/under/younger than [N] | "under 18"          | `age: { $lte: 18 }`           |
| between [N] and [M]          | "between 20 and 40" | `age: { $gte: 20, $lte: 40 }` |
| aged [N]                     | "aged 25"           | `age: { $gte: 25, $lte: 25 }` |

**Country extraction:**

Any word(s) following "from" are treated as a country name, capitalized, and matched against the `country_name` field directly in the database. No country code lookup table is used.

**Generic people keywords:**

"people", "persons", and "person" are recognized as valid queries that return all profiles (with any other filters applied), without setting a gender filter.

### Example Query Mappings

| Query                                | Resulting Filter                                                     |
| ------------------------------------ | -------------------------------------------------------------------- |
| `young males from nigeria`           | `gender: "male", age: {$gte: 16, $lte: 24}, country_name: "Nigeria"` |
| `females above 30`                   | `gender: "female", age: {$gte: 30}`                                  |
| `people from angola`                 | `country_name: "Angola"`                                             |
| `adult males from kenya`             | `gender: "male", age_group: "adult", country_name: "Kenya"`          |
| `male and female teenagers above 17` | `age_group: "teenager", age: {$gte: 17}`                             |
| `women between 25 and 35`            | `gender: "female", age: {$gte: 25, $lte: 35}`                        |

### How the Logic Works

1. The query string is lowercased and trimmed.
2. A regex checks for "from [country]" at the end of the string. If found, the country name is extracted and each word is capitalized to match the database format.
3. Gender keywords are detected via regex. If both male and female keywords appear in the same query, no gender filter is applied.
4. Age group keywords (teenager, adult, elderly, senior) are matched, including plural forms.
5. The word "young" is handled separately — it maps to the age range 16–24, not a stored age group.
6. Explicit age constraints are extracted via regex patterns for "above/over", "below/under", "between X and Y", and "aged X".
7. The words "people", "persons", or "person" are recognized so that queries like "people from angola" are valid even without a gender keyword.
8. If nothing matched, the parser returns null, and the endpoint responds with a 422 error.

## Limitations & Edge Cases

- **Synonyms and informal language.** The parser doesn't understand "guys", "ladies", "boys", "girls", "dudes", or slang.
- **Typos and misspellings.** "femal" or "nigera" won't match. No fuzzy matching.
- **Complex sentence structures.** Negation ("not from kenya") is not supported.
- **Multiple countries.** "people from nigeria and kenya" matches against "Nigeria And Kenya" as a single country name.
- **"Young" combined with age groups.** "young adults" sets both an age range (16–24) and age_group ("adult"), which may conflict.
- **Non-English queries.** Only English keywords are supported.
- **Country names containing gender keywords.** "Isle of Man" triggers the male gender filter.
- **Written-out numbers.** "above thirty" doesn't work — only digits are matched.
- **Accent-insensitive.** "côte d'ivoire" needs to match the database spelling exactly after capitalization.

## Project Structure

```
src/
├── server.ts                         # Express app setup, middleware, DB connection
├── config/
│   └── passport.ts                   # Passport GitHub OAuth strategy
├── controllers/
│   ├── authController.ts             # Auth handlers (refresh, logout, CLI auth, me)
│   └── profileController.ts          # Profile CRUD, search, export handlers
├── middlewares/
│   ├── authenticate.ts               # JWT verification and role authorization
│   └── apiVersion.ts                 # X-API-Version header check
├── models/
│   ├── userModel.ts                  # User schema (GitHub OAuth, roles)
│   └── profileModel.ts              # Profile schema
├── routes/
│   ├── authRouter.ts                 # Auth route definitions
│   └── profileRouter.ts             # Profile route definitions
├── types/
│   └── express.d.ts                  # Express.User type extension
└── utils/
    ├── jwt.ts                        # Token generation and verification
    ├── queryParser.ts                # Natural language query parser
    ├── limiter.ts                    # Rate limiting configuration
    └── helpers.ts                    # Shared utility functions
```
