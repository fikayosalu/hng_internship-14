interface ParsedQuery {
	gender?: string;
	min_age?: number;
	max_age?: number;
	age_group?: string;
	country_name?: string;
}

// Age group definitions
const AGE_GROUPS: Record<string, { min: number; max: number }> = {
	teenager: { min: 13, max: 19 },
	adult: { min: 20, max: 59 },
	elderly: { min: 60, max: 120 },
	senior: { min: 60, max: 120 },
};

// "young" is NOT a stored age group — it only maps to an age range
const YOUNG_RANGE = { min: 16, max: 24 };

export function parseNaturalQuery(query: string): ParsedQuery | null {
	const q = query.toLowerCase().trim();

	if (!q) return null;

	const result: ParsedQuery = {};
	let matched = false;

	// ---- 1. Extract country ("from <country>") ----
	const countryMatch = q.match(/from\s+(.+?)$/);
	if (countryMatch) {
		const raw = countryMatch[1]!.trim();
		result.country_name = raw.replace(/\b\w/g, (c) => c.toUpperCase());
		matched = true;
	}

	// ---- 2. Extract gender ----
	if (
		/\b(male|males|man|men)\b/.test(q) &&
		/\b(female|females|woman|women)\b/.test(q)
	) {
		// Both genders mentioned — don't filter by gender
		matched = true;
	} else if (/\b(male|males|man|men)\b/.test(q)) {
		result.gender = "male";
		matched = true;
	} else if (/\b(female|females|woman|women)\b/.test(q)) {
		result.gender = "female";
		matched = true;
	}

	// ---- 3. Extract age group (teenager, adult, elderly, senior) ----
	for (const group of Object.keys(AGE_GROUPS)) {
		const pattern = new RegExp(`\\b${group}s?\\b`);
		if (pattern.test(q)) {
			result.age_group = group;
			matched = true;
			break;
		}
	}

	// ---- 4. Handle "young" (maps to 16–24, NOT a stored age group) ----
	if (/\byoung\b/.test(q)) {
		result.min_age = YOUNG_RANGE.min;
		result.max_age = YOUNG_RANGE.max;
		matched = true;
	}

	// ---- 5. Extract explicit age patterns ----

	// "above/over/older than X"
	const aboveMatch = q.match(/(?:above|over|older\s+than)\s+(\d+)/);
	if (aboveMatch) {
		result.min_age = parseInt(aboveMatch[1]!, 10);
		matched = true;
	}

	// "below/under/younger than X"
	const belowMatch = q.match(/(?:below|under|younger\s+than)\s+(\d+)/);
	if (belowMatch) {
		result.max_age = parseInt(belowMatch[1]!, 10);
		matched = true;
	}

	// "between X and Y"
	const betweenMatch = q.match(/between\s+(\d+)\s+and\s+(\d+)/);
	if (betweenMatch) {
		result.min_age = parseInt(betweenMatch[1]!, 10);
		result.max_age = parseInt(betweenMatch[2]!, 10);
		matched = true;
	}

	// "aged X" (exact age)
	const agedMatch = q.match(/\baged\s+(\d+)\b/);
	if (agedMatch && !aboveMatch && !belowMatch && !betweenMatch) {
		result.min_age = parseInt(agedMatch[1]!, 10);
		result.max_age = parseInt(agedMatch[1]!, 10);
		matched = true;
	}

	// ---- 6. Handle "people" / "persons" as valid but genderless ----
	if (/\b(people|persons|person)\b/.test(q)) {
		matched = true;
	}

	if (!matched) return null;

	return result;
}
