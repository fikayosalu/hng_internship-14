/**
 * This file contains error handlers for specific errors
 */

import axios from "axios";

import ApiErrorClass from "./apiErrorClass";

// Handles JWT token errors
export const handleJWTErr = (err: any) => {
	if (err.message === "invalid signature") {
		return new ApiErrorClass(401, "Token is invalid");
	} else if (err.message === "jwt expired") {
		return new ApiErrorClass(401, "Token is expired");
	}
	return err;
};

// Handle duplicate name error when creating a profile
export const handleDuplicateErr = (err: any) => {
	const name = err.keyValue.name;
	return new ApiErrorClass(409, `Profile ${name} already exists`);
};

export const handleAxiosErr = (err: unknown): never => {
	if (axios.isAxiosError(err) && err.response) {
		if (err.response.status === 422) {
			throw new Error("Invalid name parameter");
		} else if (err.response.status === 429) {
			throw new Error("Request limit reached");
		} else {
			throw new Error(`${err.response.data.message}` || "Something went wrong");
		}
	} else if (err instanceof Error) {
		throw new Error(`${err.message}`);
	} else {
		throw new Error("Something went wrong");
	}
};
