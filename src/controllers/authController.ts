import { Request, Response } from "express";
import {
	generateAccessToken,
	generateRefreshToken,
	verifyToken,
} from "../utils/jwt";
import User from "../models/userModel";
import ApiErrorClass from "../errorFactory/apiErrorClass";

export const refreshToken = async (req: Request, res: Response) => {
	if (!req.body.refresh_token) {
		throw new ApiErrorClass(400, "Missing refresh token");
	}

	const tokenPayLoad = verifyToken(req.body.refresh_token);

	const id = tokenPayLoad.id;

	const existingUser = await User.findOne({ id: id });

	if (!existingUser) {
		throw new ApiErrorClass(404, "No user matches this refresh token ");
	}

	if (existingUser.refresh_token === req.body.refresh_token) {
		const accessToken = generateAccessToken(existingUser);
		const refreshToken = generateRefreshToken(existingUser);

		existingUser.refresh_token = refreshToken;

		await existingUser.save();

		return res.status(200).json({
			status: "success",
			access_token: accessToken,
			refresh_token: refreshToken,
		});
	} else {
		throw new ApiErrorClass(401, "Refresh token does not match existing data");
	}
};

export const logOut = async (req: Request, res: Response) => {
	if (!req.body.refresh_token) {
		throw new ApiErrorClass(400, "Missing refresh token");
	}

	const tokenPayLoad = verifyToken(req.body.refresh_token);

	const existingUser = await User.findOne({ id: tokenPayLoad.id });

	if (existingUser) {
		if (existingUser.refresh_token === req.body.refresh_token) {
			existingUser.refresh_token = null;

			await existingUser.save();
			return res.status(200).json({
				status: "success",
				message: "Logged out successfully",
			});
		} else {
			throw new ApiErrorClass(401, "Refresh token does not match existing data");
		}
	} else {
		throw new ApiErrorClass(404, "No user matches this refresh token ");
	}
};
