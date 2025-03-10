const authRouter = require("../../routes/authRouter");
const bcrypt = require("bcrypt");
const { app, request, prisma } = require("../setupApp")((app) => {
  require("../../config/passport").config();
  app.use(authRouter);
});

const mockUser = {
  firstName: "Test",
  lastName: "User",
  username: "TestUser",
  email: "testuser1@example.com",
  password: "TestPassword1!",
};

describe("/register", () => {
  describe("validates request", () => {
    it("sends bad request on empty body", async () => {
      const response = await request(app).post("/register");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error:
          "Missing body property/ies: username, firstName, lastName, password, email",
      });
    });

    it("sends bad request on missing first name", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, firstName: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Missing body property/ies: firstName",
      });
    });

    it("sends bad request on missing last name", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, lastName: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Missing body property/ies: lastName",
      });
    });

    it("sends bad request on missing first and last name", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, firstName: undefined, lastName: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Missing body property/ies: firstName, lastName",
      });
    });

    it("sends bad request on missing password", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Missing body property/ies: password",
      });
    });

    it("sends bad request on missing firstName and password", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: undefined, firstName: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Missing body property/ies: firstName, password",
      });
    });

    it("sends bad request on missing email", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, email: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Missing body property/ies: email",
      });
    });

    it("sends bad request when too many body properties are present (all necessary remain)", () => {
      return request(app)
        .post("/register")
        .send({ ...mockUser, foo: "random", bar: "random" })
        .expect(400)
        .then((response) => {
          expect(response.body).toEqual({
            error: "Request sent invalid properties: foo, bar",
          });
        });
    });

    it("sends bad request when too many body properties are present (missing username)", () => {
      return request(app)
        .post("/register")
        .send({
          ...mockUser,
          username: undefined,
          foo: "random",
          bar: "random",
        })
        .expect(400)
        .then((response) => {
          expect(response.body).toEqual({
            error: "Missing body property/ies: username",
          });
        });
    });

    it("sends bad request with message when invalid characters are used in username", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, username: "Čoki" });

      await expect(
        async () =>
          await prisma.user.findFirstOrThrow({
            where: {
              username: "Čoki",
            },
          })
      ).rejects.toThrow();

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        message: ["Username contains invalid characters"],
      });
    });

    it("enables only alphabetical values in first and last name", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, firstName: "Test1", lastName: "User1" });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        message: [
          "First Name contains non alphabetical values",
          "Last Name contains non alphabetical values",
        ],
      });
    });

    it("enables only alphabetical values in first name", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, firstName: "Test@" });

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual([
        "First Name contains non alphabetical values",
      ]);
    });

    it("enables only alphabetical values in last name", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, lastName: "last." });

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual([
        "Last Name contains non alphabetical values",
      ]);
    });

    it("enables only unique usernames", async () => {
      await prisma.user.create({
        data: {
          username: "TestUser1",
          firstName: "Test",
          lastName: "User",
          password: "willBeEncrypted",
          email: "random@example.com",
        },
      });

      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, username: "TestUser1" });

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual([
        "User with that username already exists",
      ]);
    });

    it("sends bad req when password is empty", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: "" });

      expect(response.status).toBe(422);
      expect(
        response.body.message.includes(
          "Password must contain at least 8 characters"
        )
      ).toBe(true);
    });

    it("sends bad req when password is shorter than 8 chars", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: "lL1@" });

      expect(response.status).toBe(422);
      expect(
        response.body.message.includes(
          "Password must contain at least 8 characters"
        )
      ).toBe(true);
    });

    it("sends bad req when password is not containing uppercase", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: "l11111@11" });

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual([
        "Password must contain at least one uppercase letter",
      ]);
    });

    it("sends bad req when password is not containing lowercase", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: "L11111@11" });

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual([
        "Password must contain at least one lowercase letter",
      ]);
    });

    it("sends bad req when password is not containing a number", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: "Ll@@@@@@" });

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual([
        "Password must contain at least one number",
      ]);
    });

    it("sends bad req when password is not containing a symbol", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, password: "Ll111111" });

      expect(response.status).toBe(422);
      expect(response.body.message).toEqual([
        "Password must contain at least one symbol",
      ]);
    });

    it("sends bad req when email is not in right formal", () => {
      return request(app)
        .post("/register")
        .send({ ...mockUser, email: "wrongemail.com" })
        .expect(422)
        .then((response) => {
          expect(response.body).toEqual({
            message: ["Email must have format username@example.com"],
          });
        });
    });

    it("sends bad req when email is in db", async () => {
      await prisma.user.create({
        data: {
          firstName: "Test",
          lastName: "User",
          email: "email@email.com",
          password: "8Length!",
          username: "SomeRandomName",
        },
      });

      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, email: "email@email.com" });
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        message: ["User with that email already exists"],
      });
    });
  });

  describe("tests logic", () => {
    it("sends ok request with message when invalid characters are used in firstName", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, firstName: "Čoki" });

      expect(response.status).toBe(200);

      await expect(
        prisma.user.findFirstOrThrow({
          where: {
            firstName: "Čoki",
          },
        })
      ).resolves.toBeTypeOf("object");
    });

    it("sends ok request with message when invalid characters are used in lastName", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, lastName: "Žika" });

      expect(response.status).toBe(200);

      await expect(
        prisma.user.findFirstOrThrow({
          where: {
            lastName: "Žika",
          },
        })
      ).resolves.toBeTypeOf("object");
    });
  });

  describe("tests logic", () => {
    it("sends ok request with message when invalid characters are used in firstName", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, firstName: "Čoki" });

      expect(response.status).toBe(200);

      await expect(
        prisma.user.findFirstOrThrow({
          where: {
            firstName: "Čoki",
          },
        })
      ).resolves.toBeTypeOf("object");
    });

    it("sends ok request with message when invalid characters are used in lastName", async () => {
      const response = await request(app)
        .post("/register")
        .send({ ...mockUser, lastName: "Žika" });

      expect(response.status).toBe(200);

      await expect(
        prisma.user.findFirstOrThrow({
          where: {
            lastName: "Žika",
          },
        })
      ).resolves.toBeTypeOf("object");
    });

    it("stores encrypted password in db", async () => {
      await request(app).post("/register").send(mockUser);
      await request(app).post("/register").send(mockUser);

      expect(
        await bcrypt.compare(
          mockUser.password,
          (
            await prisma.user.findFirst({
              where: { username: mockUser.username },
            })
          ).password
        )
      ).toBe(true);
    });
  });
});

describe("/login", () => {
  it("sends ok on successful login", async () => {
    await request(app)
      .post("/register")
      .send({ ...mockUser });
    const response = await request(app)
      .post("/login")
      .send({ username: mockUser.username, password: mockUser.password });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(
      await prisma.user.findFirst({ where: { username: mockUser.username } })
    );
  });

  it("sends 401 on wrong password login", async () => {
    await request(app)
      .post("/register")
      .send({ ...mockUser });
    const response = await request(app)
      .post("/login")
      .send({ username: mockUser.username, password: "wrongPassword" });

    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
    expect(response.body.messages).toEqual([
      "Username or password is incorrect",
    ]);
  });

  it("sends 401 on wrong username login", async () => {
    await request(app)
      .post("/register")
      .send({ ...mockUser });
    const response = await request(app)
      .post("/login")
      .send({ username: "randomUser1", password: "wrongPassword" });

    expect(response.status).toBe(401);
    expect(response.body.token).toBeUndefined();
    expect(response.body.messages).toEqual([
      "Username or password is incorrect",
    ]);
  });
});

describe("/validate", () => {
  it("sends 200 and user info on right JWT key(happy path)", async () => {
    const mockUser2 = {
      firstName: "Test",
      lastName: "User",
      username: "testuser2",
      email: "testuser2@example.com",
      password: "TestPassword2@",
    };
    await request(app).post("/register").send(mockUser);
    await request(app).post("/register").send(mockUser2);

    const response1 = await request(app)
      .post("/login")
      .send({ username: mockUser.username, password: mockUser.password });
    const response2 = await request(app)
      .post("/login")
      .send({ username: mockUser2.username, password: mockUser2.password });

    const validationRes1 = await request(app)
      .post("/validate")
      .set("Authorization", `Bearer ${response1.body.token}`)
      .send();
    expect(validationRes1.status).toBe(200);
    expect(validationRes1.body.user).toMatchObject({
      ...mockUser,
      password: expect.anything(),
    });

    const validationRes2 = await request(app)
      .post("/validate")
      .set("Authorization", `Bearer ${response2.body.token}`)
      .send();
    expect(validationRes2.status).toBe(200);
    expect(validationRes2.body.user).toMatchObject({
      ...mockUser2,
      password: expect.anything(),
    });
  });

  it("sends 401 on missing authorization", async () => {
    const validationRes1 = await request(app).post("/validate").send();
    expect(validationRes1.status).toBe(401);
  });

  it("sends 401 on authorization non bearer token", async () => {
    const validationRes1 = await request(app)
      .post("/validate")
      .set("Authorization", "Bearer randomToken")
      .send();
    expect(validationRes1.status).toBe(401);
  });
});
