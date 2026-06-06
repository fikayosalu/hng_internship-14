import ApiErrorClass from "./apiErrorClass";
import { Response } from "express";

export const handleJWTErr = (err: any, res: Response) => {
	return new ApiErrorClass(401, "Refresh token is expired. Please login");
};
