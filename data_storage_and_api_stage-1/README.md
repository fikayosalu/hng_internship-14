# Profile API

A RESTful API that accepts a name, fetches demographic data from three external APIs, applies classification logic, and stores the result. Built with TypeScript, Express, and file-based JSON storage.

## External APIs Used

- **Genderize** — predicts gender from a name
- **Agify** — predicts age from a name
- **Nationalize** — predicts nationality from a name

## Classification Rules

| Age Range | Age Group |
| --------- | --------- |
| 0–12      | child     |
| 13–19     | teenager  |
| 20–59     | adult     |
| 60+       | senior    |

Nationality is determined by the country with the highest probability from the Nationalize API response.

## Setup

```bash
# Install dependencies
npm install

# Start the server
npx ts-node index.ts
```

The server runs on port `4000` by default. Set a custom port with a `PORT` environment variable.

## Endpoints

### Create Profile

```
POST /api/profiles
Content-Type: application/json

{ "name": "ella" }
```

Returns `201 Created` with the profile data. If the name already exists, returns `200` with the existing profile.

### Get Single Profile

```
GET /api/profiles/:id
```

Returns `200` with the profile data, or `404` if not found.

### Get All Profiles

```
GET /api/profiles
```

Supports optional query parameters (case-insensitive):

- `gender` — filter by gender
- `country_id` — filter by country code
- `age_group` — filter by age group
  Example: `/api/profiles?gender=male&country_id=NG`

### Delete Profile

```
DELETE /api/profiles/:id
```

Returns `204 No Content` on success, or `404` if not found.

## Error Handling

| Status | Meaning                                     |
| ------ | ------------------------------------------- |
| 400    | Missing or empty name                       |
| 422    | Invalid type (name is not a string)         |
| 404    | Profile not found                           |
| 502    | External API returned invalid/null response |
| 500    | Unexpected server error                     |

## Tech Stack

- TypeScript
- Express
- Axios
- UUID v7
- JSON file storage
