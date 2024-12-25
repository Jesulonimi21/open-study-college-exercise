import {
  Sequelize,
  DataTypes,
  Model,
  Options,
  CreationOptional,
} from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const createConnection = (connectionString: string, options: Options) => {
  const loggingOptions = {
    logging: false,
  };
  return new Sequelize(connectionString, {
    ...options,
    ...loggingOptions,
  });
};
const connectionString: string = process.env.DB_CONNECTION || "";
const db = createConnection(connectionString, { query: { raw: true } });

interface CourseAttributes {
  id: CreationOptional<number>;
  title: string;
  description: string;
  duration: number;
  outcome: string;
  collection: number;
}
export interface CourseModel extends Model<CourseAttributes>, CourseAttributes {
  id: CreationOptional<number>;
}

type StudentAttributes = {
  email: string;
  password: string;
};
export interface StudentModel
  extends Model<StudentAttributes>,
    StudentAttributes {}

interface CollectionAttributes {
  id: CreationOptional<number>;
  name: string;
}
export interface CollectionModel
  extends Model<CollectionAttributes>,
    CollectionAttributes {}

const Course = db.define<CourseModel>("Courses", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    autoIncrement: true,
    // defaultValue: 1,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  outcome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  collection: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

const Student = db.define<StudentModel>("Student", {
  email: {
    primaryKey: true,
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Collection = db.define<CollectionModel>("Collection", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    autoIncrement: true,
    // defaultValue: 1,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

interface AdminAttributes {
  email: string;
  password: string;
}

export interface AdminModel extends Model<AdminAttributes>, AdminAttributes {}

const Admin = db.define<AdminModel>("Admin", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Collection.afterSync(async () => {
  const count = await Collection.count();
  if (count === 0) {
    await Collection.bulkCreate([
      { name: "science", id: 1 },
      { name: "arts", id: 2 },
    ]);
  }
});

export { db, Course, Student, Collection, Admin };
