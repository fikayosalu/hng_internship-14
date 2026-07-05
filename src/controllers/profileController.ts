/**
 * This module contains endpoint functions for profiles
 */

import { Request, Response } from "express";
import Profile from "../models/profileModel";
import { parseNaturalQuery } from "../utils/queryParser";
import { buildLink, catchAsync } from "../utils/helper";
import { agify, genderize, nationalize } from "../utils/externalAPI";
import countries from "i18n-iso-countries";
import ApiErrorClass from "../errorFactory/apiErrorClass";

// ── GET All Profiles ──

export const getAllProfiles = catchAsync(
	async (req: Request, res: Response) => {
		const queryObj = { ...req.query };
		const excludedFields = [
			"page",
			"sort_by",
			"order",
			"limit",
			"fields",
			"min_age",
			"max_age",
			"min_gender_probability",
			"min_country_probability",
		];

		excludedFields.forEach((el) => delete queryObj[el]);

		let query = Profile.find(queryObj);

		if (req.query.min_age) {
			const minAge = Number(req.query.min_age);
			query = query.find({ age: { $gte: minAge } });
		}

		if (req.query.max_age) {
			const maxAge = Number(req.query.max_age);
			query = query.find({ age: { $lte: maxAge } });
		}

		if (req.query.min_gender_probability) {
			const minGenderProb = Number(req.query.min_gender_probability);
			query = query.find({ gender_probability: { $gte: minGenderProb } });
		}

		if (req.query.min_country_probability) {
			const minCountryProb = Number(req.query.min_country_probability);
			query = query.find({ country_probability: { $gte: minCountryProb } });
		}

		if (req.query.sort_by) {
			let sortBy = req.query.sort_by as string;

			if (req.query.order && req.query.order === "desc") {
				sortBy = `-${sortBy}`;
				query = query.sort(sortBy);
			} else {
				query = query.sort(sortBy);
			}
		} else {
			query = query.sort("age");
		}

		let page = Math.max(1, Number(req.query.page)) || 1;
		let limit = Math.max(1, Number(req.query.limit)) || 10;

		if (limit > 50) {
			limit = 50;
		}
		const skip = (page - 1) * limit;

		query = query.skip(skip).limit(limit);

		const profiles = await query;
		const total = await Profile.countDocuments(queryObj);
		const total_pages = Math.ceil(total / limit);
		return res.status(200).json({
			status: "success",
			page,
			limit,
			total,
			total_pages,
			links: {
				self: buildLink(req, String(page), String(limit)),
				prev: page === 1 ? null : buildLink(req, String(page - 1), String(limit)),
				next:
					page === total_pages
						? null
						: buildLink(req, String(page + 1), String(limit)),
			},
			data: profiles,
		});
	},
);

// --- Create a Profile ----
export const createProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.body.name) {
		throw new ApiErrorClass(400, "Missing name parameter");
	}

	const [age, gender, country] = await Promise.all([
		agify(req.body.name),
		genderize(req.body.name),
		nationalize(req.body.name),
	]);

	const countryName = countries.getName(country.country_id, "en");

	const createProfile = {
		name: req.body.name,
		age: age.age,
		age_group: age.age_group,
		country_name: countryName || null,
		country_id: country.country_id,
		gender: gender.gender,
		gender_probability: gender.gender_probability,
		country_probability: country.country_probability,
	};

	let profile = await Profile.create(createProfile);

	return res.status(201).json({
		status: "success",
		data: profile,
	});
});

// ---- GET A PROFILE BY ID ------

export const getProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.params.id) {
		throw new ApiErrorClass(400, "Missing id parameter");
	}
	const id = req.params.id;

	const profile = await Profile.findOne({ id: id });

	if (!profile) {
		throw new ApiErrorClass(404, "Profile does not exist");
	}

	return res.status(200).json({
		status: "success",
		data: profile,
	});
});

// --- EXPORT profiles in a CSV File ---

export const exportProfileCsv = catchAsync(
	async (req: Request, res: Response) => {
		const format = req.query.format;

		if (!format || format !== "csv") {
			throw new ApiErrorClass(400, "Export format must be specified as csv");
		}

		const queryObj = { ...req.query };
		const excludedFields = [
			"page",
			"sort_by",
			"order",
			"limit",
			"fields",
			"min_age",
			"max_age",
			"min_gender_probability",
			"min_country_probability",
			"format",
		];

		excludedFields.forEach((el) => delete queryObj[el]);

		let query = Profile.find(queryObj);

		if (req.query.min_age) {
			const minAge = Number(req.query.min_age);
			query = query.find({ age: { $gte: minAge } });
		}

		if (req.query.max_age) {
			const maxAge = Number(req.query.max_age);
			query = query.find({ age: { $lte: maxAge } });
		}

		if (req.query.min_gender_probability) {
			const minGenderProb = Number(req.query.min_gender_probability);
			query = query.find({ gender_probability: { $gte: minGenderProb } });
		}

		if (req.query.min_country_probability) {
			const minCountryProb = Number(req.query.min_country_probability);
			query = query.find({ country_probability: { $gte: minCountryProb } });
		}

		if (req.query.sort_by) {
			let sortBy = req.query.sort_by as string;

			if (req.query.order && req.query.order === "desc") {
				sortBy = `-${sortBy}`;
				query = query.sort(sortBy);
			} else {
				query = query.sort(sortBy);
			}
		} else {
			query = query.sort("age");
		}

		const profiles = await query;

		const header =
			"id,name,gender,gender_probability,age,age_group,country_id,country_name,country_probability,created_at";

		const rows = profiles.map((p) => {
			return `${p.id},${p.name},${p.gender},${p.gender_probability},${p.age},${p.age_group},${p.country_id},${p.country_name},${p.country_probability},${p.created_at}`;
		});

		const csvString = [header, ...rows].join("\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="profiles_${Date.now()}.csv"`,
		);

		return res.status(200).send(csvString);
	},
);

// ── DELETE a Profile By ID ──

export const deleteProfile = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id;
	if (!id) throw new ApiErrorClass(400, "Missing ID parameter");

	const profile = await Profile.findOne({ id: id });

	if (!profile) {
		throw new ApiErrorClass(404, "Profile not found");
	}

	await Profile.findOneAndDelete({ id: id });

	return res.sendStatus(204);
});

// ---- Natural Language Search Profiles ---

export const searchProfiles = catchAsync(
	async (req: Request, res: Response) => {
		const q = req.query.q;

		if (!q || typeof q !== "string") {
			throw new ApiErrorClass(400, "Missing or empty query parameter 'q'");
		}

		const parsed = parseNaturalQuery(q);

		if (!parsed) {
			throw new ApiErrorClass(422, "Unable to interpret query");
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

		const [profiles, total] = await Promise.all([
			Profile.find(filter).skip(skip).limit(limit),
			Profile.countDocuments(filter),
		]);

		const total_pages = Math.ceil(total / limit);

		return res.status(200).json({
			status: "success",
			total,
			page,
			limit,
			total_pages,
			links: {
				self: buildLink(req, String(page), String(limit)),
				prev: page === 1 ? null : buildLink(req, String(page - 1), String(limit)),
				next:
					page === total_pages
						? null
						: buildLink(req, String(page + 1), String(limit)),
			},
			data: profiles,
		});
	},
);
