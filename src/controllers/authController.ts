import { Request, Response } from "express";
import {
	generateAccessToken,
	generateRefreshToken,
	verifyToken,
} from "../utils/jwt";
import User from "../models/userModel";
import ApiErrorClass from "../errorFactory/apiErrorClass";
import axios from "axios";

export const getMe = async (req: Request, res: Response) => {
	return res.status(200).json({
		status: "success",
		data: req.user,
	});
};

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

// --- OAuth Login Controller for CLI
export const cliGithubAuth = async (req: Request, res: Response) => {
	if (!(req.body.code_verifier && req.body.code)) {
		return res.status(400).json({
			status: "failed",
			message: "Missing code or code_verifier",
		});
	}
	try {
		const tokenResponse = await axios.post(
			"https://github.com/login/oauth/access_token",
			{
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				code: req.body.code,
				code_verifier: req.body.code_verifier,
			},
			{
				timeout: 5000,
				timeoutErrorMessage: "Request timed out",
				headers: { Accept: "application/json" },
			},
		);

		const githubAccessToken = tokenResponse.data.access_token;

		const profile = await axios.get("https://api.github.com/user", {
			headers: { Authorization: `Bearer ${githubAccessToken}` },
			timeout: 5000,
		});

		const { id: github_id, avatar_url, login: username } = profile.data;
		let email = profile.data.email;

		if (!email) {
			const response = await axios.get("https://api.github.com/user/emails", {
				headers: { Authorization: `Bearer ${githubAccessToken}` },
				timeout: 5000,
			});
			email =
				response.data.find((e: Record<string, any>) => {
					return e.primary;
				})?.email || null;
		}

		let user = await User.findOne({ github_id });

		if (user) {
			user.last_login_at = new Date();
			await user.save();
		} else {
			user = await User.create({
				github_id,
				username,
				email,
				avatar_url,
				last_login_at: new Date(),
			});
		}

		const accessToken = generateAccessToken(user);
		const refreshToken = generateRefreshToken(user);
		user.refresh_token = refreshToken;
		await user.save();

		return res.status(200).json({
			status: "success",
			data: {
				access_token: accessToken,
				refresh_token: refreshToken,
			},
		});
	} catch (error) {
		res.status(500).json({
			status: "error",
			message: "Authentication failed",
		});
	}
};
