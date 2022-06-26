import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

export interface UserDoc extends Document {
  name: string;
  email: string;
  password: string;
  refreshToken: string;
  createdAt: Date;
  matchPassword: (password: string, hashedPassword: string) => Promise<boolean>;
}

const userSchema = new mongoose.Schema<UserDoc>({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: (email: string) => validator.isEmail(email),
      message: "Invalid email",
    },
  },

  password: {
    type: String,
    required: true,
    min: [8, "Password must have 8 characters or more"],
  },

  refreshToken: String,

  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 13);
  }
});

userSchema.methods.matchPassword = async function (
  password: string,
  hashedPassword: string
) {
  return await bcrypt.compare(password, hashedPassword);
};

export const User = mongoose.model("User", userSchema);
