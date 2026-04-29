/**
 * This module contains the set up for database and express servers
 */

import express, { Request, Response } from "express";
import "dotenv/config";
import profileRouter from "./routes/profileRouter";
import cors from "cors";
import mongoose from "mongoose";
import "./config/passport";
import passport from "passport";
import authRouter from "./routes/authRouter";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.get("/test", (req: Request, res: Response) => {
	return res.json({ message: "just testing" });
});
app.use("/auth", authRouter);
app.use("/api/profiles", profileRouter);

// --- MongoDB Database Set up ---

mongoose.connect(process.env.DATABASE!);

// --- Set up server to listen for API calls

app.listen(PORT, () => {
	console.log(`Server is running on ${PORT}`);
});

export default app;
