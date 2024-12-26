import { UserInputError } from "apollo-server-express";
import { GraphQLResolveInfo } from "graphql";
import getFieldList from "graphql-list-fields";
import dotenv from "dotenv";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import GraphQLJSON from "graphql-type-json";
import { Admin, CollectionModel } from "../database/db";
dotenv.config();

export const getCourses = (
  _: any,
  { limit, sortOrder }: { limit?: number; sortOrder?: string },
  context: any,
): Course[] => {
  if (!context.isAuthenticated) {
    throw new UserInputError("Invalid Access Token");
  }
  const limitToUse = limit ? limit : 10;
  const order = sortOrder ? sortOrder : "ASC";
  if (order != "ASC" && order != "DESC") {
    throw new UserInputError("Wrong value for params sort order");
  }
  const courses = context.Course.findAll({
    limit: limitToUse,
    order: [["id", order]],
  });

  return courses;
};

export const getCollection = async (
  _: any,
  { id }: { id: number },
  context: any,
): Promise<Course[]> => {
  if (!context.isAuthenticated) {
    throw new UserInputError("Invalid Access Token");
  }
  const collection = await context.Collection.findOne({
    where: {
      id,
    },
  });
  if (!collection) {
    throw new UserInputError("Collection does not exist");
  }
  const courses = context.Course.findAll({
    where: {
      collection: collection.id,
    },
  });
  return courses;
};

export const getCollections = async (
  _: any,
  __: any,
  context: any,
): Promise<CollectionModel> => {
  if (!context.isAuthenticated) {
    throw new UserInputError("Invalid Access Token");
  }
  const collection = context.Collection.findAll();
  return collection;
};

export const getCourse = async (
  _: any,
  { id }: CourseQueryArgs,
  context: any,
  info: GraphQLResolveInfo,
) => {
  if (!context.isAuthenticated) {
    throw new UserInputError("Invalid Access Token");
  }
  const fieldNames = getFieldList(info).filter((el) => !el.includes("."));
  const course = await context.Course.findOne({
    attributes: [...fieldNames, "collection"],
    where: {
      id,
    },
  });
  return course;
};

export const addCourse = async (
  _: any,
  { title, description, outcome, duration, collection }: Course,
  context: any,
): Promise<Course> => {
  if (!context.isAuthenticated) {
    throw new UserInputError("Invalid Access Token");
  }
  const { Course } = context;
  const courseExist = await Course.findOne({
    where: {
      title,
    },
  });

  if (courseExist) {
    throw new UserInputError("Course Already exists");
  }
  const collections = await context.Collection.findAll();
  const specificCollection = collections.find(
    (el: { id: number }) => el.id == collection,
  );
  if (!specificCollection) {
    throw new UserInputError(
      "Collection must be either of arts or science, could not find collection",
    );
  }
  const course = await Course.create({
    title,
    description,
    outcome,
    duration,
    collection,
  });
  return course.dataValues;
};

export const updateCourse = async (
  _: any,
  { id, input }: { id: string; input?: any },
  context: any,
) => {
  if (!context.isAuthenticated) {
    throw new UserInputError("Invalid Access Token");
  }

  if (process.env.ONLY_ADMIN && !context.isAdmin) {
    throw new UserInputError("Only Admins can perform this function");
  }
  const { Course } = context;
  const course = await Course.findOne({
    where: {
      id,
    },
  });

  if (!course) {
    throw new UserInputError("Course does not exist");
  }
  await Course.update(
    {
      ...input,
    },
    {
      where: {
        id,
      },
    },
  );
  return {
    ...course,
    ...input,
  };
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  const admin = await Admin.findOne({
    where: {
      email: userId,
    },
  });
  return admin != undefined;
};

export const registerUser = async (
  _: any,
  { username, password }: { username: string; password: string },
  context: any
): Promise<LogInOutput> => {
  const { Student } = context;
  const student = await Student.findOne({
    where: {
      email: username,
    },
  });
  if (student) {
    throw new UserInputError("Email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { email: username, password: hashedPassword };
  const token = jwt.sign({ userId: user.email }, process.env.SECRET_KEY || "", {
    expiresIn: "1h",
  });
  await Student.create(user);
  const now = new Date();
  context.res.setHeader("Authorization", token);
  return {
    id: user.email,
    iat: now.toISOString(),
    role: "student",
    token,
    exp: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
  };
};

export const deleteCourse = async (
  _: any,
  { id }: { id: string },
  context: any,
): Promise<number> => {
  if (!context.isAuthenticated) {
    throw new UserInputError("Invalid Access Token");
  }
  const { Course } = context;
  await Course.destroy({
    where: {
      id,
    },
  });
  return 1;
};

export const isTokenValid = (token: string): boolean => {
  if (!token) {
    return false;
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || "");
    const userId = decoded;
    return userId != undefined;
  } catch (error) {
    console.error(error);
    return false;
  }
};
export const getUserIdFromToken = (token: string): string => {
  if(!token){
    return "";
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || "");
    return (decoded as { userId: string }).userId || "";
  } catch (error) {
    console.error(error);
    return "";
  }
};

export const loginUser = async (
  _: any,
  { username, password }: { username: string; password: string },
  context: any,
):Promise<LogInOutput> => {
  const { Student } = context;
  const student = await Student.findOne({
    where: {
      email: username,
    },
  });

  if (!student) {
    throw new UserInputError("User does not exist");
  }
  const passwordMatch = await bcrypt.compare(password, student.password);
  if (!passwordMatch) {
    throw new UserInputError("Incorrect username or password");
  }
  const token = jwt.sign(
    { userId: student.email },
    process.env.SECRET_KEY || "",
    {
      expiresIn: "1h",
    },
  );
  const now = new Date();
  context.res.setHeader("Authorization", token);
  return {
    id: student.email,
    iat: now.toISOString(),
    role: "student",
    token,
    exp: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
  };
};

const getCourseForCollection = async (course: Course, b: any, context: any): Promise<CollectionModel> => {
  const { loaders } = context;
  const collection = await loaders.collection.load(course.collection);
  return collection;
};

const createAdmin = async (
  _: any,
  { email, password }: { email: string; password: string },
  context: any,
): Promise<LogInOutput> => {
  const { Admin } = context;
  const adminExist = await Admin.findOne({
    where: {
      email,
    },
  });

  if (adminExist) {
    throw new UserInputError("Admin already exist");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = { email, password: hashedPassword };
  const token = jwt.sign(
    { userId: admin.email },
    process.env.SECRET_KEY || "",
    {
      expiresIn: 1210000,
    },
  );
  await Admin.create(admin);
  const now = new Date();
  context.res.setHeader("Authorization", token);
  return {
    id: admin.email,
    iat: now.toISOString(),
    role: "admin",
    token,
    exp: new Date(now.getTime() + 1210000 * 1000).toISOString(),
  };
};

export const loginAdmin = async (
  _: any,
  { email, password }: { email: string; password: string },
  context: any,
):Promise<LogInOutput> => {
  const { Admin } = context;
  const admin = await Admin.findOne({
    where: {
      email,
    },
  });

  if (!admin) {
    throw new UserInputError("Admin does not exist");
  }
  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (!passwordMatch) {
    throw new UserInputError("Incorrect username or password");
  }
  const token = jwt.sign(
    { userId: admin.email },
    process.env.SECRET_KEY || "",
    {
      expiresIn: 1210000,
    },
  );
  const now = new Date();
  context.res.setHeader("Authorization", token);
  return {
    id: admin.email,
    iat: now.toISOString(),
    role: "admin",
    token,
    exp: new Date(now.getTime() + 1210000 * 1000).toISOString(),
  };
};
const resolvers = {
  JSON: GraphQLJSON,
  CourseReturn: {
    collection: getCourseForCollection,
  },
  Query: {
    courses: getCourses,
    course: getCourse,
    collections: getCollections,
    collection: getCollection,
  },
  Mutation: {
    addCourse,
    register: registerUser,
    login: loginUser,
    deleteCourse,
    updateCourse,
    createAdmin,
    loginAdmin,
  },
};

export default resolvers;
