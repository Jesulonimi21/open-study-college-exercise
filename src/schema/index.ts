import { gql } from "apollo-server-express";
export default gql`
  scalar JSON

  type Course {
    id: ID!
    title: String!
    description: String!
    duration: Int!
    outcome: String!
    collection: String!
  }

  type Collection {
    id: Int!
    name: String!
  }

  type CourseReturn {
    id: ID!
    title: String!
    description: String!
    duration: Int!
    outcome: String!
    collection: Collection!
  }

  type AuthPayload {
    id: ID
    role: String!
    iat: String!
    exp: String!
    token: String
  }

  type Query {
    courses(limit: Int, sortOrder: String): [CourseReturn]
    course(id: Int): CourseReturn
    collection(id: Int): [Course]
    collections: [Collection]
  }
  type Mutation {
    addCourse(
      title: String!
      description: String!
      duration: Int!
      outcome: String!
      collection: Int!
    ): Course
    registerUser(email: String, password: String): AuthPayload
    loginUser(email: String, password: String): AuthPayload
    deleteCourse(id: String): Int
    updateCourse(id: String, input: JSON): Course
    createAdmin(email: String, password: String): AuthPayload
    loginAdmin(email: String, password: String): AuthPayload
  }
`;
