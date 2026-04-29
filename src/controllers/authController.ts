import { Request, Response } from "express";
import {
	generateAccessToken,
	generateRefreshToken,
	verifyToken,
} from "../utils/jwt";
import User from "../models/userModel";

export const refreshToken = async (req: Request, res: Response) => {
	if (!req.body.refresh_token) {
		return res.status(400).json({
			status: "error",
			message: "Missing refresh token",
		});
	}

	try {
		const tokenPayLoad = verifyToken(req.body.refresh_token);

		const id = tokenPayLoad.id;

		const existingUser = await User.findOne({ id: id });

		if (existingUser) {
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
				throw new Error();
			}
		} else {
			throw new Error();
		}
	} catch (error) {
		return res.status(401).json({
			status: "error",
			message: "Invalid or expired refresh token",
		});
	}
};

export const logOut = async (req: Request, res: Response) => {
	if (!req.body.refresh_token) {
		return res.status(400).json({
			status: "error",
			message: "Missing refresh token",
		});
	}

	try {
		const tokenPayLoad = verifyToken(req.body.refresh_token);

		const existingUser = await User.findOne({ id: tokenPayLoad.id });

		if (existingUser) {
			existingUser.refresh_token = null;

			await existingUser.save();
			return res.status(200).json({
				status: "success",
				message: "Logged out successfully",
			});
		} else {
			throw new Error();
		}
	} catch (error) {
		return res.status(401).json({
			status: "error",
			message: "Invalid refresh token",
		});
	}
};
