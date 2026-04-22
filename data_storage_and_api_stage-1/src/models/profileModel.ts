import mongoose, { Schema } from "mongoose";
import { v7 as uuidv7 } from "uuid";

const profileSchema = new Schema({
	_id: {
		type: Schema.Types.UUID,
		default: () => uuidv7(),
	},
	name: {
		type: String,
		required: true,
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
});

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
