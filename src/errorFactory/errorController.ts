import { NextFunction, Request, Response } from "express";
import { handleDuplicateErr, handleJWTErr } from "./errorHandlers";

const sendProdError = (err: any, res: Response) => {
	if (err.isOperational) {
		return res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		});
	} else {
		// Program error
		console.error(err);
		return res.status(500).json({
			status: "error",
			message: "Something went wrong, Please try again",
			error: err,
		});
	}
};

// const sendDevError = (err: any, res: Response) => {
// 	return res.status(err.statusCode).json({
// 		status: err.status,
// 		error: err,
// 		message: err.message,
// 		stack: err.stack,
// 	});
// };

const globalErrorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	err.status = err.status || "error";
	err.statusCode = err.statusCode || 500;
	let error = { ...err, message: err.message, name: err.name };
	if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
		error = handleJWTErr(error);
	}
	if (error.code === 11000) error = handleDuplicateErr(error);

	sendProdError(error, res);
};

export default globalErrorHandler;
