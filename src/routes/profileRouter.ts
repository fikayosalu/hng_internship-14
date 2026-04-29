/**
 * This module contains the router for profiles model
 */

import express from "express";
import {
	createProfile,
	deleteProfile,
	getAllProfiles,
	getProfile,
	searchProfiles,
} from "../controllers/profileController";

const profileRouter = express.Router();

profileRouter.route("/").get(getAllProfiles).post(createProfile);

profileRouter.route("/search").get(searchProfiles);

profileRouter.route("/:id").get(getProfile).delete(deleteProfile);

export default profileRouter;
