import { ApolloServer } from "apollo-server";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { resolvers } from "./resolvers";
import { typeDefs } from "./schemas";
import { getUserFromToken } from "./utils/getUserFromToken";

dotenv.config();

(async () => {
  try {
    // connect to db
    await mongoose.connect(`${process.env.DATABASE_URL}`);

    // setup graphql server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => {
        const accessToken = req.headers.authorization?.split(" ")[1];
        const userInfo = getUserFromToken(accessToken as any);
        return {
          userInfo,
        };
      },
    });

    // run graphql server
    server.listen(process.env.PORT).then(({ url }) => {
      console.log(`server running at ${url}`);
    });
  } catch (err: any) {
    console.log(err);
  }
})();
