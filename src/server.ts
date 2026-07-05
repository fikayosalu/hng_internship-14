/**
 * This module contains the set up for database and express servers
 */

import express, { Request, Response, NextFunction } from "express";
import "dotenv/config";
import profileRouter from "./routes/profileRouter";
import cors from "cors";
import mongoose from "mongoose";
import "./config/passport";
import passport from "passport";
import authRouter from "./routes/authRouter";
import { limit10, limit60 } from "./utils/helper";
import morgan from "morgan";
import ApiErrorClass from "./errorFactory/apiErrorClass";
import globalErrorHandler from "./errorFactory/errorController";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(passport.initialize());

app.use("/auth", limit10, authRouter);
app.use("/api/profiles", limit60, profileRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
	return next(
		new ApiErrorClass(400, `The path ${req.originalUrl} does not exist`),
	);
});

app.use(globalErrorHandler);

// --- MongoDB Database Set up ---

mongoose.connect(process.env.DATABASE!);

// --- Set up server to listen for API calls

app.listen(PORT, () => {
	console.log(`Server is running on ${PORT}`);
});

export default app;
