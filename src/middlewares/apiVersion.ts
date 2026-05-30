import { Request, Response, NextFunction } from "express";

const checkVersion = (req: Request, res: Response, next: NextFunction) => {
	const reqVersion = req.headers["x-api-version"];
	if (reqVersion === "1") {
		return next();
	}

	res.status(400).json({
		status: "error",
		message: "API version header required",
	});
};

export default checkVersion;
