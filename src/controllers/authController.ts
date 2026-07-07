/**
 * This file contains all functions used for user Authentication
 */

import { Request, Response } from "express";
import {
	generateAccessToken,
	generateRefreshToken,
	verifyToken,
} from "../utils/jwt";
import User from "../models/userModel";
import ApiErrorClass from "../errorFactory/apiErrorClass";
import axios from "axios";
import { catchAsync } from "../utils/helper";

export const getMe = catchAsync(async (req: Request, res: Response) => {
	// Returns user information when logged in
	return res.status(200).json({
		status: "success",
		data: req.user,
	});
});

/*Take refresh token and create a new access 
and refresh token for the user*/
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.body.refresh_token) {
		// Throw error if refresh token is not provided
		throw new ApiErrorClass(400, "Missing refresh token");
	}

	const tokenPayLoad = verifyToken(req.body.refresh_token);

	const id = tokenPayLoad.id;

	// Get user from database using ID
	const existingUser = await User.findOne({ id: id });

	if (!existingUser) {
		// Throw error if user was not found in database
		throw new ApiErrorClass(404, "User not found");
	}

	if (existingUser.refresh_token === req.body.refresh_token) {
		/* Compare refresh token in request body to the refresh token 
		in the user database.
		If the comparison matches generate new access and refresh tokens
		return them to the user and save the refresh token to the database */
		const access_token = generateAccessToken(existingUser);
		const refresh_token = generateRefreshToken(existingUser);

		existingUser.refresh_token = refresh_token;

		await existingUser.save();

		return res.status(200).json({
			status: "success",
			access_token,
			refresh_token,
		});
	} else {
		// Throw error if refresh token comparison doesn't match
		throw new ApiErrorClass(401, "Refresh token does not match existing data");
	}
});

// Log user out and invalidates the refresh token
export const logOut = catchAsync(async (req: Request, res: Response) => {
	// Check if the refresh token was provided
	if (!req.body.refresh_token) {
		throw new ApiErrorClass(400, "Missing refresh token");
	}

	// Extract the userID from the refresh token
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
		throw new ApiErrorClass(404, "User not found");
	}
});

// --- OAuth Login Controller for CLI
export const cliGithubAuth = catchAsync(async (req: Request, res: Response) => {
	if (!(req.body.code_verifier && req.body.code)) {
		throw new ApiErrorClass(401, "Missing code or code_verifier");
	}

	const tokenResponse = await axios.post(
		"https://github.com/login/oauth/access_token",
		{
			client_id: process.env.GITHUB_CLI_CLIENT_ID,
			client_secret: process.env.GITHUB_CLI_CLIENT_SECRET,
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
});
