import jwt from "jsonwebtoken";
import "dotenv/config";

interface User {
	id: string;
	role: string;
}

// const token = jwt.sign({ role: "" }, process.env.JWT_SECRET!, {
// 	expiresIn: "3m",
// });

// console.log(jwt.verify(token, process.env.JWT_SECRET!), token);

export const generateAccessToken = (user: User) => {
	return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
		expiresIn: "3m",
	});
};
export const generateRefreshToken = (user: User) => {
	return jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
		expiresIn: "5m",
	});
};
export const verifyToken = (token: string) => {
	return jwt.verify(token, process.env.JWT_SECRET!);
};
