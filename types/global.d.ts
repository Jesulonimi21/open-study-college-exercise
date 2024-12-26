declare global {
  type Course = {
    id: number;
    title: string;
    duration: number;
    outcome: string;
    description: string;
    collection: number;
  };

  type CourseQueryArgs = {
    id: number;
  };
  type LogInOutput = {
    id: string;
    iat: string;
    role: string;
    token: string;
    exp: string;
  };
}

export {};
