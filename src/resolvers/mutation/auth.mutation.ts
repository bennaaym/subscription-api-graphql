import { User } from "../../models";
import JWT from "jsonwebtoken";
import { ObjectId } from "mongoose";
// types
interface IAuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  userErrors: { message: string }[];
}

interface ISignUp {
  name: string;
  email: string;
  password: string;
}

interface ISignIn {
  email: string;
  password: string;
}

// utilities
const signAccessToken = (userId: string) =>
  JWT.sign({ userId }, `${process.env.JWT_ACCESS_TOKEN_SECRET}`, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  });
const signRefreshToken = (userId: string) =>
  JWT.sign({ userId }, `${process.env.JWT_REFRESH_TOKEN_SECRET}`, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  });

export const AuthMutation = {
  signUp: async (
    _: any,
    { name, email, password }: ISignUp,
    __: any
  ): Promise<IAuthResponse> => {
    try {
      let newUser = await User.create({
        name,
        email,
        password,
      });

      //create refresh token
      newUser.refreshToken = signRefreshToken(`${newUser._id}`);
      newUser.save();

      return {
        accessToken: signAccessToken(`${newUser._id}`),
        refreshToken: `${newUser?.refreshToken}`,
        userErrors: [],
      };
    } catch (err: any) {
      return {
        accessToken: null,
        refreshToken: null,
        userErrors: [{ message: err.message }],
      };
    }
  },

  signIn: async (_: any, { email, password }: ISignIn) => {
    try {
      // check if the user exist
      let user = await User.findOne({ email }).select("+password");
      if (!user) {
        return {
          accessToken: null,
          refreshToken: null,
          userErrors: [{ message: "Invalid credentials" }],
        };
      }

      // check if the password is correct
      const isCorrectPassword = await user.matchPassword(
        password,
        user.password
      );

      if (!isCorrectPassword) {
        return {
          accessToken: null,
          refreshToken: null,
          userErrors: [{ message: "Invalid credentials" }],
        };
      }

      //create refresh token
      user.refreshToken = signRefreshToken(`${user._id}`);
      user.save();

      // generate JWT
      return {
        accessToken: signAccessToken(`${user._id}`),
        refreshToken: user.refreshToken,
        userErrors: [],
      };
    } catch (err: any) {
      return {
        accessToken: null,
        refreshToken: null,
        userErrors: [{ message: "Invalid credentials" }],
      };
    }
  },
};
