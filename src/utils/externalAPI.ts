import axios from "axios";
import "dotenv/config";
import { handleAxiosErr } from "./helper";

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
			throw new Error("Gender was not determined");
		}

		return {
			gender,
			gender_probability: probability,
			count,
		};
	} catch (error) {
		handleAxiosErr(error);
		throw error;
	}
};

export const agify = async (name: string) => {
	interface T {
		age: number;
	}
	try {
		const response = await axios<T>(`https://api.agify.io?name=${name}`, {
			timeout: 5000,
			timeoutErrorMessage: "Request timed out",
		});
		const { age } = response.data;

		if (age === null) {
			throw new Error("Age was not determined");
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
		handleAxiosErr(error);
		throw error;
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
			throw new Error("Country was not determined");
		}

		const topCountry = country.reduce((max, c) =>
			c.probability > max.probability ? c : max,
		);

		return {
			country_id: topCountry.country_id,
			country_probability: topCountry.probability,
		};
	} catch (error) {
		handleAxiosErr(error);
		throw error;
	}
};
