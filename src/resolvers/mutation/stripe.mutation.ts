import { User } from "../../models";
import { stripe } from "../../stripe";
import { IContext } from "../../types";

interface IStripePayload {
  plans?:
    | {
        priceId: string;
        productId: string;
        name: string;
        price: number;
        currency: string;
      }[]
    | null;
  sessionUrl?: string | null;
  errors: { message: string }[];
}

interface IStripeCreateSession {
  priceId: string;
}

export const StripeMutation = {
  stripeGetSubscriptionPlan: async (): Promise<IStripePayload> => {
    try {
      const { data } = await stripe.prices.list({
        apiKey: `${process.env.STRIPE_SECRET_KEY}`,
      });

      const plans = data.map((plan) => ({
        priceId: plan.id as string,
        productId: plan.product as string,
        name: plan.nickname as string,
        price: Number(plan.unit_amount) / 100,
        currency: plan.currency as string,
      }));

      return {
        plans,
        errors: [],
      };
    } catch (err: any) {
      return {
        plans: [],
        errors: [{ message: err.message }],
      };
    }
  },

  stripeCreateSession: async (
    _: any,
    { priceId }: IStripeCreateSession,
    { userInfo }: IContext
  ): Promise<IStripePayload> => {
    if (!userInfo) {
      return {
        plans: null,
        errors: [{ message: "Unauthorized user" }],
      };
    }

    const user = await User.findById(userInfo.userId);
    try {
      const session = await stripe.checkout.sessions.create(
        {
          success_url: "https://github.com/bennaaym",
          cancel_url: "https://github.com/bennaaym",
          customer: user?.stripeCustomerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              quantity: 1,
              price: priceId,
            },
          ],
        },
        {
          apiKey: `${process.env.STRIPE_SECRET_KEY}`,
        }
      );

      return {
        sessionUrl: session.url,
        errors: [],
      };
    } catch (err: any) {
      console.log(err.message);
      return {
        errors: [
          { message: "Unable to create a stripe session, please try again!" },
        ],
      };
    }
  },
};
