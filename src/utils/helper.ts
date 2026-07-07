/**
 * This file contains functions used to perform
 * specific tasks
 */

import rateLimit from "express-rate-limit";
import { NextFunction, Request, Response } from "express";

export const limit10 = rateLimit({
	// set request limit to 10 requests per min
	windowMs: 60 * 1000,
	max: 10,
	message: {
		status: "error",
		message: "Request limit reached",
	},
});

export const limit60 = rateLimit({
	// set request limit to 60 requests per min
	windowMs: 60 * 1000,
	max: 60,
	message: {
		status: "error",
		message: "Request limit reached",
	},
});

export const buildLink = (req: Request, page: string, limit: string) => {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(req.query)) {
		if (key !== "page" && key !== "limit") {
			params.set(key, String(value));
		}
	}
	params.set("page", page);
	params.set("limit", limit);

	return `${req.baseUrl}${req.path}?${params.toString()}`;
};

export const catchAsync = (fn: Function) => {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
};
