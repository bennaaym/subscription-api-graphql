import { User } from "../../models";
import JWT from "jsonwebtoken";
import { ObjectId } from "mongoose";
import { stripe } from "../../stripe";
// types
interface IAuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  errors: { message: string }[];
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

interface ISignOut {
  refreshToken: string;
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
      const customer = await stripe.customers.create(
        {
          email,
        },
        { apiKey: `${process.env.STRIPE_SECRET_KEY}` }
      );

      let newUser = await User.create({
        name,
        email,
        password,
        stripeCustomerId: customer.id,
      });

      //create refresh token
      newUser.refreshToken = signRefreshToken(`${newUser._id}`);
      newUser.save();

      return {
        accessToken: signAccessToken(`${newUser._id}`),
        refreshToken: `${newUser?.refreshToken}`,
        errors: [],
      };
    } catch (err: any) {
      return {
        accessToken: null,
        refreshToken: null,
        errors: [{ message: err.message }],
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
          errors: [{ message: "Invalid credentials" }],
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
          errors: [{ message: "Invalid credentials" }],
        };
      }

      //create refresh token
      user.refreshToken = signRefreshToken(`${user._id}`);
      user.save();

      // generate JWT
      return {
        accessToken: signAccessToken(`${user._id}`),
        refreshToken: user.refreshToken,
        errors: [],
      };
    } catch (err: any) {
      return {
        accessToken: null,
        refreshToken: null,
        errors: [{ message: "Invalid credentials" }],
      };
    }
  },

  signOut: async (_: any, { refreshToken }: ISignOut, __: any) => {
    try {
      // check if the token is valid
      const { userId } = JWT.verify(
        refreshToken,
        `${process.env.JWT_REFRESH_TOKEN_SECRET}`
      ) as { userId: number };

      const user = await User.findById(userId);

      if (!user) throw new Error();

      if (user.refreshToken !== refreshToken) throw new Error();

      user.refreshToken = "";
      await user.save();

      return {
        accessToken: null,
        refreshToken: null,
        errors: [],
      };
    } catch (err: any) {
      return {
        accessToken: null,
        refreshToken: null,
        errors: [{ message: "Error occurred while signing out" }],
      };
    }
  },

  refresh: async (_: any, { refreshToken }: ISignOut, __: any) => {
    try {
      // check if the token is valid
      const { userId } = JWT.verify(
        refreshToken,
        `${process.env.JWT_REFRESH_TOKEN_SECRET}`
      ) as { userId: number };

      const user = await User.findById(userId);

      if (!user) throw new Error();

      if (user.refreshToken !== refreshToken) throw new Error();

      user.refreshToken = signRefreshToken(`${user._id}`);
      await user.save();

      return {
        accessToken: signAccessToken(`${user._id}`),
        refreshToken: user.refreshToken,
        errors: [],
      };
    } catch (err: any) {
      return {
        accessToken: null,
        refreshToken: null,
        errors: [{ message: "Invalid refresh token" }],
      };
    }
  },
};
