import express from "express";
import passport from "passport";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

const authRouter = express.Router();

// Redirect user to Github
authRouter
	.route("/github")
	.get(passport.authenticate("github", { scope: ["user:email"] }));

// Handle Github's callback
authRouter
	.route("/github/callback")
	.get(passport.authenticate("github", { session: false }), async (req, res) => {
		const user = req.user as any;
		const accessToken = generateAccessToken(user);
		const refreshToken = generateRefreshToken(user);
		user.refresh_token = refreshToken;
		await user.save();

		return res
			.status(200)
			.json({ access_token: accessToken, refresh_token: refreshToken });
	});

authRouter.route("/github/failure").get((req, res) => {
	return res.status(401).json({
		status: "error",
		message: "GitHub authentication failed",
	});
});

export default authRouter;
