import express from "express";
import "dotenv/config";
import { profileRouter } from "./routes/profileRouter";
import cors from "cors";
import mongoose from "mongoose";

export const app = express();
const PORT = process.env.PORT || 8080;

app.use("/api", profileRouter);
app.use(express.json());
app.use(cors);

// --- MongoDB Database Set up

mongoose
	.connect(process.env.DATABASE!)
	.then(() => {
		console.log("Database setup Successful");
	})
	.catch((err) => {
		console.log(`Something is wrong with database ${err.message}`);
	});

app.listen(PORT, () => {
	`Server is listening on http://localhost:${PORT}`;
});
