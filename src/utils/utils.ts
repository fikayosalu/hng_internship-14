import axios from "axios";
import "dotenv/config";

export const genderize = async (name: string) => {
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

export const agify = async (name: string) => {
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

export const nationalize = async (name: string) => {
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
