import { http, HttpResponse } from "msw";
import { config } from "../Constants";

const BACKEND_URL = config.url.BACKEND_URL;

export const handlers = [
  http.post(`${BACKEND_URL}/login`, async ({ request }) => {
    const body = await request.json();
    if (!body.username || !body.password) {
      return HttpResponse.json(
        { error: "Missing credentials" },
        { status: 401 }
      );
    }

    if (body.username != "someUsername" || body.password != "somePassword") {
      return HttpResponse.json(
        { messages: ["Username or password is incorrect"] },
        { status: 401 }
      );
    }
    return HttpResponse.json(
      {
        token: "randomJWTtoken",
        user: {
          firsName: "Some",
          lastName: "Random",
          username: "someUsername",
          password: "somePassword",
          email: "someemail@some.com",
          photoPublicId: null,
          id: "someUUID",
        },
      },
      { status: 200 }
    );
  }),

  http.post(`${BACKEND_URL}/register`, async ({ request }) => {
    const body = await request.json();
    const message = [];

    if (body.username == "inDatabase") {
      message.push("User with that username already exists");
    }

    if (body.email == "indatabase@example.com") {
      message.push("User with that email already exists");
    }

    if (message.length) {
      return HttpResponse.json({ message }, { status: 422 });
    }
    return new HttpResponse(null);
  }),

  http.all(`${BACKEND_URL}/test`, async ({ request }) => {
    return HttpResponse.json({
      passedHeaders: [...request.headers],
      isValid: true,
    });
  }),

  http.post(`${BACKEND_URL}/validate`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader === "Bearer randomJWTtoken") {
      return HttpResponse.json({}, { status: 200 });
    }
    return HttpResponse.json({}, { status: 401 });
  }),
];
