import { gql } from "apollo-server";
export const typeDefs = gql`
  type Query {
    hello: String
  }

  type Mutation {
    signUp(name: String!, email: String!, password: String!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    signOut(refreshToken: String!): AuthPayload!
    refresh(refreshToken: String!): AuthPayload!

    stripeGetSubscriptionPlan: StripePayload!
    stripeCreateSession(priceId: String!): StripePayload!
  }

  """
  Payloads
  """
  type AuthPayload {
    accessToken: String
    refreshToken: String
    errors: [Error!]!
  }

  type StripePayload {
    plans: [Plan!]
    sessionUrl: String
    errors: [Error!]!
  }

  type Plan {
    priceId: ID!
    productId: ID!
    name: String!
    price: Float!
    currency: String!
  }

  type Error {
    message: String!
  }
`;
