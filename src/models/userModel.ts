/**
 * This file contains the model definition and specification
 * for the user database
 */

import mongoose, { Schema } from "mongoose";
import { uuidv7 } from "uuidv7";

const userSchema = new Schema(
	{
		id: {
			type: Schema.Types.UUID,
			default: () => uuidv7(),
		},
		github_id: {
			type: String,
			unique: true,
		},
		username: String,
		email: String,
		avatar_url: String,
		role: {
			type: String,
			enum: {
				values: ["admin", "analyst"],
			},
			default: "analyst",
		},
		is_active: {
			type: Boolean,
			default: true,
		},
		refresh_token: {
			type: String,
			default: null,
		},
		last_login_at: Date,
		created_at: {
			type: Date,
			default: Date.now,
		},
	},
	{
		toJSON: {
			transform(doc: Document, ret: Record<string, unknown>) {
				const { _id, __v, id, ...rest } = ret;
				return { id, ...rest };
			},
		},
	},
);

const User = mongoose.model("User", userSchema);

export default User;
