import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import User from "../models/userModel";

export const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	let accessToken = req.headers["authorization"];
	if (!accessToken || !accessToken.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ status: "error", message: "Invalid or empty access token" });
	}
	accessToken = accessToken.split(" ")[1]!;

	try {
		const tokenPayLoad = verifyToken(accessToken);
		const existingUser = await User.findOne({ id: tokenPayLoad.id });

		if (!existingUser) {
			return res
				.status(401)
				.json({ status: "error", message: "Invalid access token" });
		}

		if (existingUser.is_active === false) {
			return res.status(403).json({
				status: "error",
				message: "This account is deactivated",
			});
		}

		req.user = existingUser;

		next();
	} catch (error) {
		return res.status(401).json({
			status: "error",
			message: "Invalid access token",
		});
	}
};

export const authorizeRoles = (...roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({
				status: "error",
				message: "You do not have permission to perform this action",
			});
		}
		next();
	};
};
