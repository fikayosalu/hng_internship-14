/**
 * This module contains the set up for database and express servers
 */

import express from "express";
import "dotenv/config";
import { profileRouter } from "./routes/profileRouter";
import cors from "cors";
import mongoose from "mongoose";

export const app = express();
const PORT = process.env.PORT || 4000;

app.use("/api", profileRouter);
app.use(express.json());
app.use(cors);

// --- MongoDB Database Set up ---

mongoose
	.connect(process.env.DATABASE!)
	.then(() => {
		console.log("Database setup Successful");
	})
	.catch((err) => {
		console.log(`Something is wrong with database ${err.message}`);
	});

// --- Set up server to listen for API calls

app.listen(PORT, () => {
	`Server is listening on http://localhost:${PORT}`;
});
