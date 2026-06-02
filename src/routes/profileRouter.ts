/**
 * This module contains the router for profiles model
 */

import express from "express";
import {
	createProfile,
	deleteProfile,
	exportProfileCsv,
	getAllProfiles,
	getProfile,
	searchProfiles,
} from "../controllers/profileController";
import { authenticate, authorizeRoles } from "../middlewares/authenticate";
import checkVersion from "../middlewares/apiVersion";

const profileRouter = express.Router();

profileRouter.use(checkVersion);
profileRouter
	.route("/")
	.get(authenticate, authorizeRoles("admin", "analyst"), getAllProfiles)
	.post(authenticate, authorizeRoles("admin"), createProfile);

profileRouter
	.route("/export")
	.get(authenticate, authorizeRoles("admin", "analyst"), exportProfileCsv);

profileRouter
	.route("/search")
	.get(authenticate, authorizeRoles("admin", "analyst"), searchProfiles);

profileRouter
	.route("/:id")
	.get(authenticate, authorizeRoles("admin", "analyst"), getProfile)
	.delete(authenticate, authorizeRoles("admin"), deleteProfile);

export default profileRouter;
