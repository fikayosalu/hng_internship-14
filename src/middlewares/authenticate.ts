import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import User from "../models/userModel";
import ApiErrorClass from "../errorFactory/apiErrorClass";
import { catchAsync } from "../utils/helper";

export const authenticate = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		let accessToken = req.headers["authorization"];
		if (!accessToken || !accessToken.startsWith("Bearer ")) {
			throw new ApiErrorClass(401, "Invalid or empty access token");
		}
		accessToken = accessToken.split(" ")[1]!;

		const tokenPayLoad = verifyToken(accessToken);
		const existingUser = await User.findOne({ id: tokenPayLoad.id });

		if (!existingUser) {
			throw new ApiErrorClass(404, "User not found");
		}

		if (existingUser.is_active === false) {
			throw new ApiErrorClass(403, "This account is deactivated");
		}

		req.user = existingUser;

		next();
	},
);

export const authorizeRoles = (...roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user || !roles.includes(req.user.role)) {
			throw new ApiErrorClass(
				403,
				"You do not have permission to perform this action",
			);
		}
		next();
	};
};
