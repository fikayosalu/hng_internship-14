# Profile Data Storage & API

A RESTful API built with Express and TypeScript for storing, querying, and searching user profiles. Features full CRUD operations, filtered listing with sorting and pagination, and a natural language search endpoint that parses plain English queries into database filters — all without AI or LLMs.

Built as part of the HNG Internship (Stage 1).

## Live URL

`https://hngstage-1-kappa.vercel.app/`

## Tech Stack

- Node.js + Express 5
- TypeScript
- MongoDB Atlas + Mongoose
- uuidv7 (time-ordered unique IDs)
- tsx + nodemon (dev runtime)

## Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/fikayosalu/hng_internship-14.git
cd data_storage_and_api_stage-1
npm install
```

Create a `.env` file in the project root:

```
DATABASE=mongodb+srv://your_user:your_password@cluster.mongodb.net/your_db_name
PORT=4000
```

Start the dev server:

```bash
npm run dev
```

Build and run for production:

```bash
npm run build
npm start
```

## Endpoints

### Create a Profile

**POST** `/api/profiles`

Request body:

```json
{
	"name": "Peter Johnson",
	"gender": "male",
	"gender_probability": 0.95,
	"age": 28,
	"age_group": "adult",
	"country_id": "NG",
	"country_name": "Nigeria",
	"country_probability": 0.85
}
```

Success response — `201 Created`:

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

### Get All Profiles

**GET** `/api/profiles`

Supports filtering, sorting, and pagination via query parameters:

| Parameter | Description                             | Example                   |
| --------- | --------------------------------------- | ------------------------- |
| gender    | Filter by gender                        | `?gender=male`            |
| age_group | Filter by age group                     | `?age_group=adult`        |
| sort_by   | Field to sort by                        | `?sort_by=age`            |
| order     | Sort direction (asc or desc)            | `?sort_by=age&order=desc` |
| page      | Page number (default: 1)                | `?page=2`                 |
| limit     | Results per page (default: 10, max: 50) | `?limit=20`               |

### Get a Profile by ID

**GET** `/api/profiles/:id`

Returns a single profile by its UUID.

### Delete a Profile

**DELETE** `/api/profiles/:id`

Returns `204 No Content` on success.

### Natural Language Search

**GET** `/api/profiles/search?q=<query>`

Parses plain English queries and converts them into database filters. Pagination (`page`, `limit`) applies here too.

Example request:

```
GET /api/profiles/search?q=young males from nigeria&page=1&limit=10
```

Success response:

```json
{
  "status": "success",
  "total": 42,
  "page": 1,
  "limit": 10,
  "data": [...]
}
```

## Error Responses

All errors follow this shape:

```json
{
	"status": "error",
	"message": "..."
}
```

| Status | Condition                                |
| ------ | ---------------------------------------- |
| 400    | Missing required field in request body   |
| 400    | Duplicate profile name                   |
| 400    | Unable to interpret search query         |
| 400    | Missing or empty `q` parameter on search |
| 404    | Profile not found by ID                  |
| 500    | Server error                             |

---

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

Any word(s) following "from" are treated as a country name, capitalized, and matched against the `country_name` field. For example, "from nigeria" becomes `country_name: "Nigeria"` and "from south africa" becomes `country_name: "South Africa"`.

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
2. A regex checks for "from [country]" at the end of the string. If found, the country name is extracted and each word is capitalized (to match the database format). This is queried directly against the `country_name` field — no country code lookup table is used.
3. Gender keywords are detected via regex. If both male and female keywords appear in the same query (e.g., "male and female teenagers"), no gender filter is applied.
4. Age group keywords (teenager, adult, elderly, senior) are matched, including plural forms.
5. The word "young" is handled separately — it is not a stored age group but maps to the age range 16–24.
6. Explicit age constraints are extracted via regex patterns for "above/over", "below/under", "between X and Y", and "aged X". If an explicit age pattern is found, it can override or coexist with the "young" range.
7. The words "people", "persons", or "person" are recognized so that queries like "people from angola" are valid even without a gender keyword.
8. If none of the above steps matched anything, the parser returns `null`, and the endpoint responds with `{ "status": "error", "message": "Unable to interpret query" }`.

---

## Limitations & Edge Cases

**Not handled:**

- **Synonyms and informal language.** The parser doesn't understand "guys", "ladies", "boys", "girls", "dudes", "elders", or any slang. Only the specific keywords listed above are recognized.
- **Typos and misspellings.** "femal" or "nigera" won't match. There is no fuzzy matching or spell correction.
- **Complex sentence structures.** The parser uses simple regex, not a grammar parser. Sentences like "show me people who are male and older than 30 but not from kenya" won't be fully parsed — negation ("not from") is not supported.
- **Multiple countries.** "people from nigeria and kenya" will try to match "nigeria and kenya" as a single country name, which won't exist in the database.
- **Age ranges combined with age groups.** Queries like "young adults" will set both `min_age/max_age` (from "young") and `age_group: "adult"` simultaneously, which may produce unexpected results since the age range of "young" (16–24) and "adult" (20–59) only partially overlap.
- **Non-English queries.** Only English keywords are supported.
- **Country names that contain gender keywords.** A country name like "Isle of Man" would trigger the male gender filter due to the word "Man". This is a known regex limitation.
- **Ordinal or written-out numbers.** "above thirty" or "older than twenty-five" won't work — only numeric digits are matched.
- **Relative age terms beyond "young".** Words like "old", "middle-aged", or "underage" are not mapped to any filter.
- **The parser is case-insensitive but not accent-aware.** Country names with diacritics (e.g., "côte d'ivoire") need to match the exact database spelling after capitalization.

**Design decisions:**

- "Young" intentionally maps to an age range (16–24) rather than a stored age group, per the task specification.
- When both "male" and "female" appear in a query, the gender filter is dropped entirely rather than erroring, allowing queries like "male and female teenagers" to work as expected.
- Country matching relies on the `country_name` field in the database rather than a code lookup table, keeping the parser simple and dependency-free.
- The parser is deliberately strict: ambiguous queries return an error rather than guessing incorrectly.

## Project Structure

```
src/
├── server.ts                    # Express app setup, middleware, DB connection
├── controllers/
│   └── profileController.ts     # Route handlers for all endpoints
├── models/
│   └── profileModel.ts          # Mongoose schema and model
├── routes/
│   └── profileRouter.ts         # Route definitions
└── utils/
    └── queryParser.ts           # Natural language query parser
```
