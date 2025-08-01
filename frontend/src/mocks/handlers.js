import { http, HttpResponse } from "msw";
import { config, DEMO_USER_PASSWORD, DEMO_USER_USERNAME } from "../Constants";
import { Jimp } from "jimp";

const BACKEND_URL = config.url.BACKEND_URL;
const MS_IN_DAY = 1000 * 60 * 60 * 24;

class User {
  static allUsers = {};

  constructor(
    firstName,
    lastName,
    username,
    email,
    password,
    id,
    optional = {}
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.username = username;
    this.email = email;
    this.password = password;
    this.id = id;
    this.token = optional.token;
    this.profilePicture = optional.profilePicture;
    this.photoPublicId = optional.photoPublicId;

    User.allUsers[this.username] = this;
  }

  getBasicObject() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      password: this.password,
      email: this.email,
      photoPublicId: this.photoPublicId,
      id: this.id,
    };
  }

  get bearerToken() {
    if (!this.token)
      throw new Error(`${this.username} doesn't have defined token`);
    return `Bearer ${this.token}`;
  }

  async getPictureBuffer() {
    if (!this.profilePicture)
      throw new Error(`${this.username} doesn't have profile picture`);
    return this.profilePicture.getBuffer("image/jpeg");
  }
}

const userFactory = (firstName, lastName) => {
  const username = firstName + lastName;

  return new User(
    firstName,
    lastName,
    username,
    username.toLowerCase() + "@some.com",
    username + "@1",
    `someUUIDfor${username}`
  );
};

const messageFactory = (
  message,
  date,
  senderUser,
  receiverUser = defaultTestUser
) => {
  return {
    date,
    message,
    sender: senderUser.username,
    receiver: receiverUser.username,
  };
};

export const defaultTestUser = new User(
  "Some",
  "Random",
  "someUsername",
  "someemail@some.com",
  "somePassword",
  "someUUId",
  {
    token: "randomJWTtoken",
    profilePicture: new Jimp({ height: 200, width: 200 }, "#FFFFFF"),
  }
);

export const firstTestUser = new User(
  "Test",
  "One",
  "Test",
  "testone@some.com",
  "TestOne@1",
  "someUUIDforTest",
  { profilePicture: new Jimp({ height: 200, width: 200 }, "#AAAAAA") }
);

export const secondTestUser = new User(
  "Test2",
  "Two",
  "Test2",
  "testtwo@some.com",
  "TestTwo@1",
  "someUUIDforTest2",
  { token: "secondJWTtoken" }
);

const demoTestUser = new User(
  "Demo",
  "User",
  DEMO_USER_USERNAME,
  "demo@email.com",
  DEMO_USER_PASSWORD
);

export const poolingTestUser = userFactory("Pooling", "User");
export const oldMessagesUser = userFactory("Old", "Messages");
export const userWithoutPicture = userFactory("Without", "Picture");
export const dateMessagesUser = userFactory("Date", "Messages");
export const yesterdaysMessagesUser = userFactory("Yesterdays", "Messages");
export const todaysMessagesUser = userFactory("@todays", "Messages");

export const profPic1 = firstTestUser.profilePicture;
export const profPic1Buffer = firstTestUser.getPictureBuffer();
export const defaultProfPic = defaultTestUser.profilePicture;
export const defaultPicBuffer = defaultTestUser.getPictureBuffer();

export const defaultTestUserToken = defaultTestUser.token;
export const defaultTestUserBearer = defaultTestUser.bearerToken;
export const secondTestUserToken = secondTestUser.token;
export const secondTestUserBearer = secondTestUser.bearerToken;

export const Test2InstantMessage = "Hello from Test2";
export const TestPoolingMessage = "Hello this is message from pooling!";
export const oldMessage = `Hello, this is an old message from ${oldMessagesUser.username}`;
export const firstDateMessage = "First dated message";
export const firstYesterdaysDateMessage = "First yesterdays message";
export const firstTodaysDateMessage = "First todays message";

const db = User.allUsers;

export const loginPostHandler = async ({ request }) => {
  const body = await request.json();
  if (!body.username || !body.password) {
    return HttpResponse.json({ error: "Missing credentials" }, { status: 401 });
  }

  if (
    body.username === demoTestUser.username &&
    body.password === demoTestUser.password
  ) {
    return HttpResponse.json({
      token: defaultTestUserToken,
      user: demoTestUser.getBasicObject(),
    });
  }

  if (body.username != "someUsername" || body.password != "somePassword") {
    return HttpResponse.json(
      { messages: ["Username or password is incorrect"] },
      { status: 401 }
    );
  }
  return HttpResponse.json(
    {
      token: defaultTestUserToken,
      user: defaultTestUser.getBasicObject(),
    },
    { status: 200 }
  );
};

export const userGetHandler = ({ request }) => {
  const url = new URL(request.url);
  const queries = url.searchParams;

  if (queries.has("exists")) {
    return new HttpResponse(null, {
      status: queries.get("exists") in db ? 200 : 400,
    });
  }

  if (queries.has("s")) {
    return HttpResponse.json(
      Object.values(db).filter((usr) => usr.username.includes(queries.get("s")))
    );
  }

  return HttpResponse.json([
    { username: defaultTestUser.username },
    { username: poolingTestUser.username },
    { username: todaysMessagesUser.username },
    { username: yesterdaysMessagesUser.username },
    { username: oldMessagesUser.username },
  ]);
};

export const handlers = [
  http.post(`${BACKEND_URL}/login`, loginPostHandler),

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

  http.post(`${BACKEND_URL}/validate`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader === defaultTestUserBearer) {
      return HttpResponse.json(
        {
          user: defaultTestUser.getBasicObject(),
        },
        { status: 200 }
      );
    } else if (authHeader === secondTestUserBearer) {
      return HttpResponse.json(
        {
          user: secondTestUser.getBasicObject(),
        },
        { status: 200 }
      );
    }
    return HttpResponse.json({}, { status: 401 });
  }),

  http.get(
    `${BACKEND_URL}/users/profile-picture/:username`,
    async ({ params }) => {
      if (Object.keys(db).includes(params.username)) {
        const user = db[params.username];
        try {
          return HttpResponse.arrayBuffer(await user.getPictureBuffer());
        } catch {
          return new HttpResponse(null, { status: 204 });
        }
      }

      switch (params.username) {
        case "NoPictureTest":
          return new HttpResponse(null, { status: 204 });
      }
    }
  ),

  http.get(`${BACKEND_URL}/users`, userGetHandler),
  http.put(`${BACKEND_URL}/users/update`, async ({ request }) => {
    const reqBody = await request.json();
    return HttpResponse.json({
      newUsername: reqBody.newUsername,
      newEmail: reqBody.newEmail,
    });
  }),

  http.post(`${BACKEND_URL}/messages`, async ({ request }) => {
    const body = await request.json();
    if (body.receiver == secondTestUser.username) {
      return HttpResponse.json([
        {
          date: new Date(new Date() - 1000 * 60),
          message: Test2InstantMessage,
        },
      ]);
    }
    return HttpResponse.json([]);
  }),

  http.get(`${BACKEND_URL}/messages`, ({ request }) => {
    const url = new URL(request.url);
    const sender = url.searchParams.get("sender");

    return sender == poolingTestUser.username
      ? HttpResponse.json([
          {
            date: new Date(new Date() - 60 * 1000),
            message: TestPoolingMessage,
          },
        ])
      : new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BACKEND_URL}/messages/old`, ({ request }) => {
    const url = new URL(request.url);
    const partner = url.searchParams.get("partner");
    const firstDate = new Date(new Date() - MS_IN_DAY * 5);
    if (partner == oldMessagesUser.username) {
      return HttpResponse.json([
        messageFactory(oldMessage, new Date(), oldMessagesUser),
      ]);
    }
    if (partner == dateMessagesUser.username) {
      const secondDate = new Date(new Date() - MS_IN_DAY * 4);
      return HttpResponse.json([
        messageFactory(firstDateMessage, firstDate, dateMessagesUser),
        messageFactory(
          `Second message sent on ${firstDate}`,
          firstDate,
          dateMessagesUser
        ),
        messageFactory(
          `Message sent on ${secondDate}`,
          secondDate,
          dateMessagesUser
        ),
      ]);
    }
    if (partner === yesterdaysMessagesUser.username) {
      const yesterdayDate = new Date(new Date() - MS_IN_DAY);

      return HttpResponse.json([
        messageFactory(
          "Not an yesterdays message",
          firstDate,
          yesterdaysMessagesUser
        ),
        messageFactory(
          firstYesterdaysDateMessage,
          yesterdayDate,
          yesterdaysMessagesUser
        ),
        messageFactory(
          "Second yesterdays message",
          yesterdayDate,
          defaultTestUser,
          yesterdaysMessagesUser
        ),
      ]);
    }

    if (partner === todaysMessagesUser.username) {
      const todayDate = new Date(new Date() - 1000 * 60 * 10);

      return HttpResponse.json([
        messageFactory("Not an todays message", firstDate, todaysMessagesUser),
        messageFactory(firstTodaysDateMessage, todayDate, todaysMessagesUser),
        messageFactory(
          "Second todays message",
          todayDate,
          defaultTestUser,
          todaysMessagesUser
        ),
      ]);
    }

    return HttpResponse.json([]);
  }),
];
