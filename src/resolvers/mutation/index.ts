import { AuthMutation } from "./auth.mutation";
import { StripeMutation } from "./stripe.mutation";

export const Mutation = {
  ...AuthMutation,
  ...StripeMutation,
};
