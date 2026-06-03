import { NextFunction, Request, Response } from "express";

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
	sendProdError(err, res);
};

export default globalErrorHandler;
