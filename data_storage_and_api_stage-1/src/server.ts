/**
 * This module contains the set up for database and express servers
 */

import express from "express";
import "dotenv/config";
import { profileRouter } from "./routes/profileRouter";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use("/api/profiles", profileRouter);

// --- MongoDB Database Set up ---

mongoose.connect(process.env.DATABASE!);

// --- Set up server to listen for API calls

app.listen(PORT, () => {
	console.log(`Server is running on ${PORT}`);
});

export default app;
