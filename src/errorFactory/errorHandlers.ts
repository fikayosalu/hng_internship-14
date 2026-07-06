import ApiErrorClass from "./apiErrorClass";

export const handleJWTErr = (err: any) => {
	if (err.message === "invalid signature") {
		return new ApiErrorClass(401, "Token is invalid");
	} else if (err.message === "jwt expired") {
		return new ApiErrorClass(401, "Token is expired");
	}
	return err;
};

export const handleDuplicateErr = (err: any) => {
	const name = err.keyValue.name;
	return new ApiErrorClass(409, `Profile ${name} already exists`);
};
