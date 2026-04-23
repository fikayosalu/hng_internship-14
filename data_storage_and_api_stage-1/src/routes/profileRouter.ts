/**
 * This module contains the router for profiles model
 */

import express from "express";
import {
	createProfile,
	deleteProfile,
	getAllProfiles,
	getProfile,
} from "../controllers/profileController";

export const profileRouter = express.Router();

profileRouter.route("/profiles").get(getAllProfiles).post(createProfile);

profileRouter.route("/profiles/:id").get(getProfile).delete(deleteProfile);
