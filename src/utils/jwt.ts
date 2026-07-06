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

// const token = jwt.sign({ role: "" }, process.env.JWT_SECRET!, {
// 	expiresIn: "3m",
// });

// console.log(jwt.verify(token, process.env.JWT_SECRET!), token);

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
