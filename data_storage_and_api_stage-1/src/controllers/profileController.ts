/**
 * This module contains endpoint functions for profiles
 */

import { Request, Response } from "express";
import Profile from "../models/profileModel";
import { parseNaturalQuery } from "../utils/queryParser";

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

		if (req.query.page || req.query.limit) {
			let page = 1;
			let limit = 10;
			try {
				page = Number(req.query.page) || 1;
				limit = Number(req.query.limit) || 10;
			} catch (error) {
				return res
					.status(422)
					.json({ status: "error", message: "Invalid parameter type" });
			}
			const skip = (page - 1) * limit;
			if (limit > 50) {
				return res
					.status(400)
					.json({ status: "error", message: "limit should be less that 50" });
			}

			query = query.skip(skip).limit(limit);
		} else {
			const page = 1;
			const limit = 10;
			const skip = (page - 1) * limit;
			query = query.skip(skip).limit(limit);
		}
		const profiles = await query;
		const total = await Profile.countDocuments(queryObj);
		return res.status(200).json({
			status: "success",
			page: req.query.page || 1,
			limit: req.query.limit || 10,
			total,
			data: profiles,
		});
	} catch (error) {
		return res.status(400).json({ status: "error", message: `${error}` });
	}
};

// --- Create a Profile ----
export const createProfile = async (req: Request, res: Response) => {
	const bodyArr = [
		"name",
		"age",
		"age_group",
		"country_name",
		"country_id",
		"gender",
		"gender_probability",
		"country_probability",
	];

	for (const el of bodyArr) {
		if (!(el in req.body)) {
			return res
				.status(400)
				.json({ status: "error", message: `Missing parameter: ${el}` });
		}
	}

	try {
		const existingProfile = await Profile.find({ name: req.body.name.trim() });
		if (existingProfile.length > 0) {
			return res
				.status(400)
				.json({ status: "error", message: "name already exists" });
		}

		let profile = await Profile.create(req.body);

		return res.status(201).json({
			status: "success",
			data: profile,
		});
	} catch (error) {
		return res
			.status(400)
			.json({ status: "error", message: "Missing or empty parameter" });
	}
};

// ---- GET A PROFILE BY ID ------

export const getProfile = async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const profile = await Profile.find({ id: id });

	if (!profile) {
		return res
			.status(404)
			.json({ status: "error", message: "Profile not found" });
	}

	return res.status(200).json({
		status: "success",
		data: profile,
	});
};

// ── DELETE a Profile By ID ──

export const deleteProfile = async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const profile = await Profile.find({ id: id });

	if (!profile) {
		return res
			.status(404)
			.json({ status: "error", message: "Profile not found" });
	}

	return res.sendStatus(204);
};

// ---- Natural Language Search Profiles ---

export const searchProfiles = async (req: Request, res: Response) => {
	const q = req.query.q;

	if (!q || typeof q !== "string") {
		return res.status(400).json({
			status: "error",
			message: "Missing or empty query parameter 'q'",
		});
	}

	const parsed = parseNaturalQuery(q);

	if (!parsed) {
		return res.status(400).json({
			status: "error",
			message: "Unable to interpret query",
		});
	}

	// ---- Build the Mongoose filter from parsed result ----
	const filter: Record<string, unknown> = {};

	if (parsed.gender) {
		filter.gender = parsed.gender;
	}

	if (parsed.country_name) {
		filter.country_name = parsed.country_name;
	}

	if (parsed.age_group) {
		filter.age_group = parsed.age_group;
	}

	if (parsed.min_age !== undefined || parsed.max_age !== undefined) {
		filter.age = {};
		if (parsed.min_age !== undefined) {
			(filter.age as Record<string, number>).$gte = parsed.min_age;
		}
		if (parsed.max_age !== undefined) {
			(filter.age as Record<string, number>).$lte = parsed.max_age;
		}
	}

	// ---- Pagination ----
	const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
	const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
	const skip = (page - 1) * limit;

	try {
		const [profiles, total] = await Promise.all([
			Profile.find(filter).skip(skip).limit(limit),
			Profile.countDocuments(filter),
		]);

		return res.status(200).json({
			status: "success",
			total,
			page,
			limit,
			data: profiles,
		});
	} catch (error) {
		return res.status(500).json({
			status: "error",
			message: "Server error while searching profiles",
		});
	}
};
