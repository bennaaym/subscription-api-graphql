import JWT from "jsonwebtoken";
export const getUserFromToken = (accessToken: string) => {
  try {
    return JWT.verify(
      accessToken,
      `${process.env.JWT_ACCESS_TOKEN_SECRET}`
    ) as {
      userId: number;
    };
  } catch (err: any) {
    return null;
  }
};
