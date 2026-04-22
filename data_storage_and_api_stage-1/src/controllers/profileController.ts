import { Request, Response } from "express";
import Profile from "../models/profileModel";

// ── GET All Profiles ──

export const getAllProfiles = async (req: Request, res: Response) => {
	const queryObj = { ...req.query };
	const excludedFields = ["page", "sort_by", "order", "limit", "fields"];

	excludedFields.forEach((el) => delete queryObj[el]);

	try {
		let query = Profile.find(queryObj);

		if (req.query.sort_by) {
			let sortBy = req.query.sort_by as string;

			if (req.query.order && req.query.order === "desc") {
				sortBy = `-${sortBy}`;
				query = query.sort(sortBy);
			} else {
				query = query.sort(sortBy);
			}
		}

		if (req.query.page) {
		}
	} catch (error) {}
};

// --- Create a Profile ----
export const createProfile = async (req: Request, res: Response) => {
	// const { name } = req.body;
	// if (!name || (typeof name === "string" && name.trim() === "")) {
	// 	return res
	// 		.status(400)
	// 		.json({ status: "error", message: "Missing or empty name" });
	// }
	// if (typeof name !== "string") {
	// 	return res.status(422).json({ status: "error", message: "Invalid type" });
	// }
	// const profiles = readProfiles();
	// const existing = profiles.find(
	// 	(p) => p.name.toLowerCase() === name.toLowerCase(),
	// );
	// if (existing) {
	// 	return res.status(200).json({
	// 		status: "success",
	// 		message: "Profile already exists",
	// 		data: existing,
	// 	});
	// }
	// try {
	// 	const { gender, gender_probability, count } = await genderize(name);
	// 	const { age, age_group } = await agify(name);
	// 	const { country_id, country_probability } = await nationalize(name);
	// 	const profile: Profile = {
	// 		id: uuidv7(),
	// 		name,
	// 		gender,
	// 		gender_probability: parseFloat(gender_probability.toFixed(2)),
	// 		sample_size: count,
	// 		age,
	// 		age_group,
	// 		country_id,
	// 		country_probability: parseFloat(country_probability.toFixed(2)),
	// 		created_at: new Date().toISOString(),
	// 	};
	// 	profiles.push(profile);
	// 	writeProfiles(profiles);
	// 	return res.status(201).json({
	// 		status: "success",
	// 		data: profile,
	// 	});
	// } catch (error) {
	// 	if (error instanceof Error) {
	// 		return res.status(502).json({
	// 			status: "error",
	// 			message: `${error.message} returned an invalid response`,
	// 		});
	// 	}
	// 	return res.status(502).json({
	// 		status: "error",
	// 		message: "Aasfa returned an invalid response",
	// 	});
	// }
};

// ---- GET A PROFILE BY ID ------

export const getProfile = async (req: Request, res: Response) => {
	// const { id } = req.params;
	// const profiles = readProfiles();
	// const profile = profiles.find((p) => p.id === id);
	// if (!profile) {
	//   return res.status(404).json({
	//     status: "error",
	//     message: "Profile not found",
	//   });
	// }
	// return res.status(200).json({
	//   status: "success",
	//   data: profile,
	// });
};

// ── DELETE a Profile By ID ──

export const deleteProfile = async (req: Request, res: Response) => {
	// const { id } = req.params;
	// const profiles = readProfiles();
	// const index = profiles.findIndex((p) => p.id === id);
	// if (index === -1) {
	// 	return res.status(404).json({
	// 		status: "error",
	// 		message: "Profile not found",
	// 	});
	// }
	// profiles.splice(index, 1);
	// writeProfiles(profiles);
	// return res.sendStatus(204);
};
