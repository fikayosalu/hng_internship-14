import mongoose, { Schema } from "mongoose";
import { uuidv7 } from "uuidv7";

const profileSchema = new Schema(
	{
		id: {
			type: Schema.Types.UUID,
			default: () => uuidv7(),
		},
		name: {
			type: String,
			unique: true,
			trim: true,
		},
		gender: {
			type: String,
			enum: {
				values: ["male", "female"],
				message: "Gender can only be male or female",
			},
		},
		gender_probability: Number,
		age: Number,
		age_group: {
			type: String,
			enum: {
				values: ["child", "teenager", "adult", "senior"],
				message: "Age group can either be child, teenager, adult or senior",
			},
		},
		country_id: {
			type: String,
			minlength: 2,
			maxlength: 2,
		},
		country_name: String,
		country_probability: Number,
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

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
