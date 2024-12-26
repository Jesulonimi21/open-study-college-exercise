import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  gql,
  NormalizedCacheObject,
} from "@apollo/client";
import app from "../src/index";

function makeid(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const TEST_TIME_OUT = 20_000;
let client: ApolloClient<NormalizedCacheObject>;
let token = "";
const user = makeid(10);
let idToUse = 0;
const adminUser = makeid(10);
describe("test open study group asessment", () => {
  beforeAll(async () => {
    console.log("wait for db Connection");
    await new Promise((res) => {
      setTimeout(() => {
        res(0);
      }, 10000);
    });
    const { port } = app.address();
    const link = new HttpLink({
      uri: `http://localhost:${port}/graphql`,
    });
    const cache = new InMemoryCache({ addTypename: false });
    client = new ApolloClient({
      link,
      cache,
    });
  }, TEST_TIME_OUT);

  test("Can Register User", async () => {
    const { data } = await client.mutate({
      mutation: gql`
        mutation RegisterUser($username: String) {
          register(username: $username, password: "baggy") {
            role
            iat
            exp
            id
            token
          }
        }
      `,
      variables: { username: user },
    });
    expect(data.register.token).toBeDefined();
  });

  test("Registered User Can Login", async () => {
    const { data } = await client.mutate({
      mutation: gql`
        mutation LogInUser($username: String) {
          login(username: $username, password: "baggy") {
            role
            iat
            exp
            id
            token
          }
        }
      `,
      variables: { username: user },
    });
    token = data.login.token;
    expect(data.login.token).toBeDefined();
  });

  test("Cannot fetch course without authorization token", async () => {
    await expect(
      client.query<{ course: any }>({
        query: gql`
          query {
            course(id: 1) {
              title
            }
          }
        `,
      }),
    ).rejects.toThrow();
  });

  test("Logged in user can fetch courses with authorization", async () => {
    const { data } = await client.query<{ course: any }>({
      query: gql`
        query {
          course(id: 1) {
            title
          }
        }
      `,
      context: {
        headers: {
          authorization: token,
        },
      },
    });
    expect(data.course).toBeDefined();
  });

  test("Cannot fetch all courses without authorization", async () => {
    await expect(
      client.query<{ courses: any }>({
        query: gql`
          query {
            courses(sortOrder: "DESC") {
              id
            }
          }
        `,
      }),
    ).rejects.toThrow();
  });

  test(
    "can fetch all courses with authorization",
    async () => {
      const { data } = await client.query<{ courses: any }>({
        query: gql`
          query {
            courses(sortOrder: "DESC") {
              id
            }
          }
        `,
        context: {
          headers: {
            authorization: token,
          },
        },
      });
      expect(data.courses).toBeDefined();
    },
    TEST_TIME_OUT,
  );

  test("Cannot Add Courses without authorization", async () => {
    const course = makeid(5);
    const collection = 1;
    const description = makeid(15);
    const outcome = makeid(15);
    const duration = 6;
    await expect(
      client.mutate({
        mutation: gql`
          mutation AddCourse(
            $title: String!
            $description: String!
            $duration: Int!
            $outcome: String!
            $collection: Int!
          ) {
            addCourse(
              title: $title
              description: $description
              duration: $duration
              outcome: $outcome
              collection: $collection
            ) {
              title
            }
          }
        `,
        variables: {
          title: course,
          description: description,
          duration,
          outcome,
          collection,
        },
      }),
    ).rejects.toThrow();
  });

  test("Can Add Courses with authorization", async () => {
    const course = makeid(5);
    const collection = 1;
    const description = makeid(15);
    const outcome = makeid(15);
    const duration = 6;
    const { data } = await client.mutate({
      mutation: gql`
        mutation AddCourse(
          $title: String!
          $description: String!
          $duration: Int!
          $outcome: String!
          $collection: Int!
        ) {
          addCourse(
            title: $title
            description: $description
            duration: $duration
            outcome: $outcome
            collection: $collection
          ) {
            title
            id
          }
        }
      `,
      variables: {
        title: course,
        description: description,
        duration,
        outcome,
        collection,
      },
      context: {
        headers: {
          authorization: token,
        },
      },
    });
    idToUse = data.addCourse.id;
  });

  test("Cannot fetch collection without authorization", async () => {
    await expect(
      client.query({
        query: gql`
          query {
            collections {
              name
            }
          }
        `,
      }),
    ).rejects.toThrow();
  });

  test("Can fetch collection with authorization", async () => {
    const { data } = await client.query({
      query: gql`
        query {
          collections {
            name
          }
        }
      `,
      context: {
        headers: {
          authorization: token,
        },
      },
    });
    expect(data.collections).toBeDefined();
  });

  test("Cannot fetch single collection without authorization", async () => {
    await expect(
      client.query({
        query: gql`
          query {
            collection(id: 1) {
              title
            }
          }
        `,
      }),
    ).rejects.toThrow();
  });

  test("Can fetch single collection with authorization", async () => {
    const { data } = await client.query({
      query: gql`
        query {
          collection(id: 1) {
            title
          }
        }
      `,
      context: {
        headers: {
          authorization: token,
        },
      },
    });
    expect(data.collection).toBeDefined();
  });
  test("Cannot update course without authorization", async () => {
    const course = makeid(5);
    const collection = 1;
    const description = makeid(15);
    const outcome = makeid(15);
    const duration = 6;
    await expect(
      client.mutate({
        mutation: gql`
          mutation UpdateCourse(
            $title: String!
            $description: String!
            $duration: Int!
            $outcome: String!
            $collection: Int!
            $id: String!
          ) {
            updateCourse(
              id: $id
              input: {
                title: $title
                description: $description
                duration: $duration
                outcome: $outcome
                collection: $collection
              }
            ) {
              title
            }
          }
        `,
        variables: {
          title: course,
          description: description,
          duration,
          outcome,
          collection,
          id: idToUse,
        },
      }),
    ).rejects.toThrow();
  });

  test("Can update course with authorization", async () => {
    const course = makeid(5);
    const collection = 1;
    const description = makeid(15);
    const outcome = makeid(15);
    const duration = 6;
    const { data } = await client.mutate({
      mutation: gql`
        mutation UpdateCourse(
          $title: String!
          $description: String!
          $duration: Int!
          $outcome: String!
          $collection: Int!
          $id: String!
        ) {
          updateCourse(
            id: $id
            input: {
              title: $title
              description: $description
              duration: $duration
              outcome: $outcome
              collection: $collection
            }
          ) {
            title
          }
        }
      `,
      variables: {
        title: course,
        description: description,
        duration,
        outcome,
        collection,
        id: idToUse,
      },
      context: {
        headers: {
          authorization: token,
        },
      },
    });
    expect(data.updateCourse.title).toBe(course);
  });

  test("Cannot delete course without Authorization", async () => {
    await expect(
      client.mutate({
        mutation: gql`
          mutation DeleteUser($id: String!) {
            deleteCourse(id: $id)
          }
        `,
        variables: {
          id: idToUse,
        },
      }),
    ).rejects.toThrow();
  });

  test("Can delete course with Authorization", async () => {
    await client.mutate({
      mutation: gql`
        mutation DeleteUser($id: String!) {
          deleteCourse(id: $id)
        }
      `,
      variables: {
        id: idToUse,
      },
      context: {
        headers: {
          authorization: token,
        },
      },
    });
    const { data } = await client.query({
      query: gql`
        query {
          courses(sortOrder: "DESC") {
            id
            collection {
              id
              name
            }
          }
        }
      `,
      context: {
        headers: {
          authorization: token,
        },
      },
    });

    expect(data.courses.filter((el: any) => el.id === idToUse).length).toBe(0);
  });

  test("Cannot create admin with wrong secret key", async () => {
    await expect(
      client.mutate({
        mutation: gql`
          mutation CreateAdmin(
            $email: String!
            $password: String!
            $adminSecret: String!
          ) {
            createAdmin(
              email: $email
              password: $password
              adminSecret: $adminSecret
            ) {
              role
              iat
              exp
            }
          }
        `,
        variables: {
          email: adminUser,
          password: "description",
          adminSecret: "ninfidnd",
        },
      }),
    ).rejects.toThrow();
  });

  test("Can Create Admin With right secret key", async () => {
    const { data } = await client.mutate({
      mutation: gql`
        mutation CreateAdmin(
          $email: String!
          $password: String!
          $adminSecret: String!
        ) {
          createAdmin(
            email: $email
            password: $password
            adminSecret: $adminSecret
          ) {
            role
            iat
            exp
          }
        }
      `,
      variables: {
        email: adminUser,
        password: "pass",
        adminSecret: process.env.ADMIN_SECRET_KEY,
      },
    });
    expect(data.createAdmin.role).toBe("admin");
  });

  test("Cannot Log Admin in with wrong details", async () => {
    await expect(
      client.mutate({
        mutation: gql`
          mutation LoginAdmin($email: String!, $password: String!) {
            loginAdmin(email: $email, password: $password) {
              role
              iat
              exp
            }
          }
        `,
        variables: {
          email: adminUser,
          password: "passes",
        },
      }),
    ).rejects.toThrow();
  });

  test("Can login Admin with right details", async () => {
    const { data } = await client.mutate({
      mutation: gql`
        mutation LoginAdmin($email: String!, $password: String!) {
          loginAdmin(email: $email, password: $password) {
            role
            iat
            exp
          }
        }
      `,
      variables: {
        email: adminUser,
        password: "pass",
      },
    });
    expect(data.loginAdmin.role).toBe("admin");
  });

  afterAll(async () => {
    app.close();
    console.log("Wait for DB Close");
    await new Promise((res) => {
      setTimeout(() => {
        res(0);
      }, 15000);
    });
  }, TEST_TIME_OUT);
});
