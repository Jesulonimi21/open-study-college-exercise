import express from "express";
import { ApolloServer } from "apollo-server-express";
import typeDefs from "./schema";
import { Request, Response, NextFunction } from "express";
import resolvers, {
  getUserIdFromToken,
  isAdmin,
  isTokenValid,
} from "./resolvers";
import * as db from "./database/db";
import DataLoader from "dataloader";

const app = express() as any;

db.db.authenticate().then(() => {
  db.db.sync({ alter: true });
  console.log("Connected to db");
});

const dataLoaders = async () => {
  return {
    collection: new DataLoader((id: any) => {
      return db.Collection.findAll({
        where: {
          id,
        },
      });
    }),
  };
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, res }) => {
    const token = req.headers.authorization || "";
    const loaders = await dataLoaders();
    const userId = getUserIdFromToken(token);
    const admin = await isAdmin(userId);
    return {
      ...db,
      token,
      res,
      req,
      loaders,
      isAuthenticated: isTokenValid(token),
      isAdmin: admin,
    };
  },
});

server.applyMiddleware({
  app,
  cors: true,
});
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

export default app.listen(8080, () => {
  console.log("App started listening");
});
