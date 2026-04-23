/**
 * This module contains endpoint functions for profiles
 */

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

		if (req.query.page || req.query.limit) {
			let page = 1;
			let limit = 10;
			try {
				page = Number(req.query.page) || 1;
				limit = Number(req.query.limit) || 10;
			} catch (error) {
				res
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
		}
		query = query.select("-__v");
		const profiles = await query;

		res.status(200).json({
			status: "success",
			page: req.query.page || 1,
			limit: req.query.limit || 10,
			total: profiles.length,
			data: profiles,
		});
	} catch (error) {
		res.status(400).json({ status: "error", message: "" });
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

	bodyArr.forEach((el) => {
		if (!(el in req.body)) {
			res
				.status(400)
				.json({ status: "error", message: "Missing or empty parameter" });
		}
	});
	try {
		const name = await Profile.find({ name: req.body.name.trim() });
		if (name) {
			res.status(400).json({ status: "error", message: "name" });
		}

		const profile = await Profile.create(req.body);

		res.status(201).json({
			status: "success",
			data: profile,
		});
	} catch (error) {
		res
			.status(400)
			.json({ status: "error", message: "Missing or empty parameter" });
	}
};

// ---- GET A PROFILE BY ID ------

export const getProfile = async (req: Request, res: Response) => {
	const { id } = req.params;

	const profile = await Profile.findById(id).select("-__v");

	if (!profile) {
		res.status(404).json({ status: "error", message: "Profile not found" });
	}

	res.status(200).json({
		status: "success",
		data: profile,
	});
};

// ── DELETE a Profile By ID ──

export const deleteProfile = async (req: Request, res: Response) => {
	const { id } = req.params;
	const profile = await Profile.findByIdAndDelete(id);

	if (!profile) {
		res.status(404).json({ status: "error", message: "Profile not found" });
	}

	res.sendStatus(204);
};
