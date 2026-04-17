import axios from "axios";
import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { v7 as uuidv7 } from "uuid";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

const DATA_FILE = "profiles.json";

interface Profile {
	id: string;
	name: string;
	gender: string;
	gender_probability: number;
	sample_size: number;
	age: number;
	age_group: string;
	country_id: string;
	country_probability: number;
	created_at: string;
}

const readProfiles = (): Profile[] => {
	if (!fs.existsSync(DATA_FILE)) return [];
	const raw = fs.readFileSync(DATA_FILE, "utf-8");
	return JSON.parse(raw);
};

const writeProfiles = (profiles: Profile[]): void => {
	fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2));
};

const genderize = async (name: string) => {
	interface T {
		gender: string;
		probability: number;
		count: number;
	}
	try {
		const response = await axios<T>(`https://api.genderize.io?name=${name}`, {
			timeout: 5000,
		});
		const { gender, probability, count } = response.data;

		if (gender === null || count === 0) {
			throw new Error();
		}

		return {
			gender,
			gender_probability: probability,
			count,
		};
	} catch (error) {
		throw new Error("Genderize");
	}
};

const agify = async (name: string) => {
	interface T {
		age: number;
	}
	try {
		const response = await axios<T>(`https://api.agify.io?name=${name}`, {
			timeout: 5000,
		});
		const { age } = response.data;

		if (age === null) {
			throw new Error();
		}

		return {
			age,
			age_group:
				age <= 12
					? "child"
					: age <= 19
						? "teenager"
						: age <= 59
							? "adult"
							: "senior",
		};
	} catch (error) {
		throw new Error("Agify");
	}
};

const nationalize = async (name: string) => {
	interface Country {
		country_id: string;
		probability: number;
	}
	interface T {
		name: string;
		count: number;
		country: Country[];
	}

	try {
		const response = await axios<T>(`https://api.nationalize.io?name=${name}`, {
			timeout: 5000,
		});
		const { country } = response.data;

		if (!country || country.length === 0) {
			throw new Error();
		}

		const topCountry = country.reduce((max, c) =>
			c.probability > max.probability ? c : max,
		);

		return {
			country_id: topCountry.country_id,
			country_probability: topCountry.probability,
		};
	} catch (error) {
		throw new Error("Nationalize");
	}
};

app.post("/api/profiles", async (req: Request, res: Response) => {
	const { name } = req.body;

	if (!name || (typeof name === "string" && name.trim() === "")) {
		return res
			.status(400)
			.json({ status: "error", message: "Missing or empty name" });
	}

	if (typeof name !== "string") {
		return res.status(422).json({ status: "error", message: "Invalid type" });
	}

	const profiles = readProfiles();
	const existing = profiles.find(
		(p) => p.name.toLowerCase() === name.toLowerCase(),
	);

	if (existing) {
		return res.status(200).json({
			status: "success",
			message: "Profile already exists",
			data: existing,
		});
	}

	try {
		const { gender, gender_probability, count } = await genderize(name);
		const { age, age_group } = await agify(name);
		const { country_id, country_probability } = await nationalize(name);

		const profile: Profile = {
			id: uuidv7(),
			name,
			gender,
			gender_probability: parseFloat(gender_probability.toFixed(2)),
			sample_size: count,
			age,
			age_group,
			country_id,
			country_probability: parseFloat(country_probability.toFixed(2)),
			created_at: new Date().toISOString(),
		};

		profiles.push(profile);
		writeProfiles(profiles);

		return res.status(201).json({
			status: "success",
			data: profile,
		});
	} catch (error) {
		if (error instanceof Error) {
			return res.status(502).json({
				status: "error",
				message: `${error.message} returned an invalid response`,
			});
		}
		return res.status(502).json({
			status: "error",
			message: "Aasfa returned an invalid response",
		});
	}
});

// ── GET /api/profiles ──

app.get("/api/profiles", async (req: Request, res: Response) => {
	let profiles = readProfiles();

	// Case-insensitive filtering
	const { gender, country_id, age_group } = req.query;

	if (gender && typeof gender === "string") {
		profiles = profiles.filter(
			(p) => p.gender.toLowerCase() === gender.toLowerCase(),
		);
	}

	if (country_id && typeof country_id === "string") {
		profiles = profiles.filter(
			(p) => p.country_id.toLowerCase() === country_id.toLowerCase(),
		);
	}

	if (age_group && typeof age_group === "string") {
		profiles = profiles.filter(
			(p) => p.age_group.toLowerCase() === age_group.toLowerCase(),
		);
	}

	return res.status(200).json({
		status: "success",
		count: profiles.length,
		data: profiles.map((p) => ({
			id: p.id,
			name: p.name,
			gender: p.gender,
			age: p.age,
			age_group: p.age_group,
			country_id: p.country_id,
		})),
	});
});

app.get("/api/profiles/:id", async (req: Request, res: Response) => {
	const { id } = req.params;
	const profiles = readProfiles();
	const profile = profiles.find((p) => p.id === id);

	if (!profile) {
		return res.status(404).json({
			status: "error",
			message: "Profile not found",
		});
	}

	return res.status(200).json({
		status: "success",
		data: profile,
	});
});

// ── DELETE /api/profiles/:id ──

app.delete("/api/profiles/:id", async (req: Request, res: Response) => {
	const { id } = req.params;
	const profiles = readProfiles();
	const index = profiles.findIndex((p) => p.id === id);

	if (index === -1) {
		return res.status(404).json({
			status: "error",
			message: "Profile not found",
		});
	}

	profiles.splice(index, 1);
	writeProfiles(profiles);

	return res.sendStatus(204);
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
