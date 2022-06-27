import { User } from "../models";
import { Article } from "../models/article.model";
import { stripe } from "../stripe";
import { IContext } from "../types";

interface ArticlePayload {
  articles: {
    id: string;
    title: string;
    imageUrl: string;
    content: string;
    access: "Basic" | "Standard" | "Premium";
  }[];
  errors: { message: string }[];
}

export const Query = {
  articles: async (
    _: any,
    __: any,
    { userInfo }: IContext
  ): Promise<ArticlePayload> => {
    try {
      if (!userInfo) {
        return {
          articles: [],
          errors: [{ message: "Unauthenticated user" }],
        };
      }

      const user = await User.findById(userInfo.userId);

      const subscriptions = await stripe.subscriptions.list(
        {
          customer: user?.stripeCustomerId,
          status: "all",
          expand: ["data.default_payment_method"],
        },
        {
          apiKey: `${process.env.STRIPE_SECRET_KEY}`,
        }
      );

      if (!subscriptions.data.length) {
        return {
          articles: [],
          errors: [],
        };
      }
      //@ts-ignore
      const plan = subscriptions.data[0].plan.nickname;

      let articles;

      switch (plan) {
        case "Basic":
          articles = await Article.find({
            access: "Basic",
          });
          break;
        case "Standard":
          articles = await Article.find({
            access: { $in: ["Basic", "Standard"] },
          });
          break;
        case "Premium":
          articles = await Article.find({});
          break;
      }
      return {
        articles: articles as any,
        errors: [],
      };
    } catch (err: any) {
      return {
        articles: [],
        errors: [{ message: err.message }],
      };
    }
  },
};
