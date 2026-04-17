import axios from "axios";
import "dotenv/config";
import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 4000;
console.log("Testing");

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
			probability,
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

		if (country.length === 0) {
			throw new Error();
		}

		return {
			country_id: country[0]?.country_id,
			country_probability: country[0]?.probability,
		};
	} catch (error) {
		throw new Error("Nationalize");
	}
};

const data1 = await genderize("john");
const data2 = await agify("john");
const data3 = await nationalize("john");

console.log(data1);
console.log(data2);
console.log(data3);

app.post("/api/profiles", async (req: Request, res: Response) => {
	const { name } = req.body;

	if (!name) {
		return res
			.status(400)
			.json({ status: "error", message: "Message or empty name" });
	} else if (typeof name !== "string") {
		return res.status(422).json({ status: "error", message: "Invalid type" });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
