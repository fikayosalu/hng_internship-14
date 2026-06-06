import rateLimit from "express-rate-limit";
import { NextFunction, Request, Response } from "express";

export const limit10 = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	message: {
		status: "error",
		message: "Request limit reached",
	},
});

export const limit60 = rateLimit({
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
