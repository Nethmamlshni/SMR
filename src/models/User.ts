import mongoose, { Schema, models, model, Model } from "mongoose";

interface IUser {
  name: string;
  username: string;
  passwordHash: string;
  role: "admin" | "supervisor";
  active: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "supervisor"],
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  models.User || model<IUser>("User", UserSchema);

export default User;