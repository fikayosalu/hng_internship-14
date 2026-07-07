/**
 * This file contains functionality to handle Github
 * OAuth 2.0 login using passport and stores result in the database
 */

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import "dotenv/config";
import User from "../models/userModel";
import { VerifyCallback } from "passport-oauth2";

interface T {
	value: string;
}

interface P {
	id: string;
	username: string;
	emails: T[];
	photos: T[];
}

passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
			callbackURL: "http://localhost:4000/auth/github/callback",
		},
		async (
			accessToken: string,
			refreshToken: string,
			profile: P,
			done: VerifyCallback,
		) => {
			try {
				const { id: github_id, username, emails, photos } = profile;

				const existingUser = await User.findOne({ github_id: github_id });

				if (existingUser) {
					existingUser.last_login_at = new Date();
					await existingUser.save();
					return done(null, existingUser);
				}

				const user = {
					github_id,
					username,
					email: emails?.[0]?.value || null,
					avatar_url: photos[0]?.value || null,
					last_login_at: new Date(),
				};

				const newUser = await User.create(user);

				done(null, newUser);
			} catch (error) {
				if (error instanceof Error) {
					return done(error);
				}
				return done(new Error("Authentication failed"));
			}
		},
	),
);
