import ApiErrorClass from "./apiErrorClass";

export const handleJWTErr = (err: any) => {
	if (err.message === "jwt malformed") {
		return new ApiErrorClass(401, "Token is invalid");
	} else if (err.message === "jwt expired") {
		return new ApiErrorClass(401, "Token is expired");
	}
	return err;
};
