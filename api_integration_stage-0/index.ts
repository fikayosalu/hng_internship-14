import express from "express";
import "dotenv/config";
import cors from "cors";
import type { Request, Response } from "express";
import axios from "axios";

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/classify", async (req: Request, res: Response) => {
	/* This function accepts request query and uses it in a 
	"genderize" api where the gender of the name provide in the query
	is determined
		that 
	*/
	const param = req.query.name;

	if (!param) {
		return res
			.status(400)
			.json({ status: "error", message: "Missing or empty name parameter" });
	} else if (typeof param !== "string") {
		return res
			.status(400)
			.json({ status: "error", message: "name is not a string" });
	}

	interface T {
		name: string;
		gender: string;
		probability: number;
		count: number;
	}

	try {
		const response = await axios<T>(`https://api.genderize.io?name=${param}`, {
			timeout: 5000,
		});

		const { name, gender, probability, count } = response.data;

		if (gender === null || count === 0) {
			return res.status(400).json({
				status: "error",
				message: "No prediction available for the provided name",
			});
		}

		return res.status(200).json({
			status: "success",
			name,
			gender,
			probability,
			sample_size: count,
			is_confident: true ? probability >= 0.7 && count >= 100 : false,
			processed_at: new Date().toISOString(),
		});
	} catch (error) {
		return res.status(502).json({
			status: "error",
			message: "Upstream or Server Failure. Please try again later",
		});
	}
});

app.listen(PORT, () => {
	console.log(`Server is listening on http://localhost:${PORT}`);
});
