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
  }

  """
  Payloads
  """
  type AuthPayload {
    accessToken: String
    refreshToken: String
    userErrors: [UserError!]!
  }

  """
  Errors
  """
  type UserError {
    message: String!
  }
`;
