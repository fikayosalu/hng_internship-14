import rateLimit from "express-rate-limit";

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
