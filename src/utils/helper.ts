import rateLimit from "express-rate-limit";
import { NextFunction, Request, Response } from "express";
import axios from "axios";

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

export const handleAxiosErr = (err: unknown): never => {
	if (axios.isAxiosError(err) && err.response) {
		if (err.response.status === 422) {
			throw new Error("Invalid name parameter");
		} else if (err.response.status === 429) {
			throw new Error("Request limit reached");
		} else {
			throw new Error(`${err.message}` || "Something went wrong");
		}
	} else if (err instanceof Error) {
		throw new Error(`${err.message}`);
	} else {
		throw new Error("Something went wrong");
	}
};
