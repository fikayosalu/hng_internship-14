# Name Gender Classifier API

A small Express + TypeScript API that takes a name and returns a predicted gender, probability, and a confidence flag. It wraps the public [Genderize.io](https://genderize.io) API and adds basic input validation, a confidence heuristic, and consistent JSON responses.

## Live URL

`<add deployment URL here>`

## Tech Stack

- Node.js + Express 5
- TypeScript
- Axios (HTTP client for the upstream API)
- tsx + nodemon (dev runtime and auto-reload)

## Setup

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd api_integration_stage-0
npm install
```

Start the dev server:

```bash
npm run dev
```

The server runs on `http://localhost:4000` by default.

## Endpoint

### `GET /api/classify`

Predicts the gender associated with a given name.

**Query parameters**

| Name | Type   | Required | Description          |
| ---- | ------ | -------- | -------------------- |
| name | string | yes      | The name to classify |

**Example request**

```bash
curl "http://localhost:4000/api/classify?name=peter"
```

**Successful response** — `200 OK`

```json
{
	"status": "success",
	"name": "peter",
	"gender": "male",
	"probability": 0.99,
	"sample_size": 23423,
	"is_confident": true,
	"processed_at": "2026-04-14T12:34:56.789Z"
}
```

A result is marked `is_confident: true` when the upstream probability is at least `0.7` and the sample size is at least `100`. Below either threshold it returns `false`.

## Error Responses

| Status | Condition                                          | Message                                              |
| ------ | -------------------------------------------------- | ---------------------------------------------------- |
| 400    | `name` query parameter is missing                  | `Missing or empty name parameter`                    |
| 400    | `name` is not a string (e.g. passed as an array)   | `name is not a string`                               |
| 400    | Upstream returned no prediction for the given name | `No prediction available for the provided name`      |
| 502    | Upstream API unreachable or any unexpected failure | `Upstream or Server Failure. Please try again later` |

All error responses follow the same shape:

```json
{
	"status": "error",
	"message": "..."
}
```
