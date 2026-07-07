/**
 * This file handles functions used to generate and verify
 * Json Web Tokens
 */

import jwt from "jsonwebtoken";
import "dotenv/config";

export interface TokenPayLoad {
	id: string;
	role: string;
}

interface UserForToken {
	id: string | unknown;
	role: string;
}

export const generateAccessToken = (user: UserForToken) => {
	return jwt.sign(
		{ id: String(user.id), role: user.role },
		process.env.JWT_SECRET!,
		{
			expiresIn: "10m",
		},
	);
};
export const generateRefreshToken = (user: UserForToken) => {
	return jwt.sign({ id: String(user.id) }, process.env.JWT_SECRET!, {
		expiresIn: "12m",
	});
};
export const verifyToken = (token: string): TokenPayLoad => {
	return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayLoad;
};
