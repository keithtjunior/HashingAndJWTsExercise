const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

let user1, user2, msg1, msg2;

describe("Users Routes Test", function () {

    beforeEach(async function () {
      await db.query("DELETE FROM messages");
      await db.query("DELETE FROM users");
  
      user1 = await User.register({
        username: "test1",
        password: "password",
        first_name: "Test",
        last_name: "One",
        phone: "555-555-5555",
      });
      user2 = await User.register({
        username: "test2",
        password: "password",
        first_name: "Test",
        last_name: "Two",
        phone: "555-555-5555",
      });
      msg1 = await Message.create({
        from_username: "test1",
        to_username: "test2",
        body: "u1-to-u2"
      });
      msg2 = await Message.create({
        from_username: "test2",
        to_username: "test1",
        body: "u2-to-u1"
      });
    });

    describe("GET /users/", function () {
        test("can get list of users", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test1", password: "password" });
            let token = res.body.token;

            let response = await request(app).get("/users/")
            .send({ _token: token });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ users: [
                {
                    first_name: user2.first_name,
                    last_name: user2.last_name,
                    phone: user2.phone,
                    username: user2.username,
                },
                {
                    first_name: user1.first_name,
                    last_name: user1.last_name,
                    phone: user1.phone,
                    username: user1.username,
                }
            ]});
        });

        test("unauthenticated user can't get list of users", async function () {
            let response = await request(app).get("/users/");
            expect(response.statusCode).toBe(401);
        });
    });

    describe("GET /users/:username", function () {
        test("can get user details", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test1", password: "password" });
            let token = await res.body.token;

            let response = await request(app).get(`/users/${user1.username}`)
            .send({ _token: token });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ user: {
                first_name: user1.first_name,
                last_name: user1.last_name,
                phone: user1.phone,
                username: user1.username,
                join_at: expect.any(String),
                last_login_at: expect.any(String)
            }});
        });

        test("unauthenticated user can't get user details", async function () {
            let response = await request(app).get(`/users/${user1.username}`)
            expect(response.statusCode).toBe(401);
        });
    });

    describe("GET /users/:username/to", function () {
        test("can get messages to user", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test1", password: "password" });
            let token = await res.body.token;

            let response = await request(app).get(`/users/${user1.username}/to`)
            .send({ _token: token });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ messages: [{
                    id: msg2.id,
                    body: msg2.body,
                    sent_at: expect.any(String),
                    read_at: null,
                    from_user: {
                        first_name: user2.first_name,
                        last_name: user2.last_name,
                        phone: user2.phone,
                        username: user2.username
                    }
            }]});
        });

        test("unauthorized user can't get messages to user", async function () {
            let res = await request(app)
            .post("/auth/register")
            .send({
                username: "test3",
                password: "password",
                first_name: "Test",
                last_name: "Three",
                phone: "555-555-5555",
            });
            let token = res.body.token;

            let response = await request(app).get(`/users/${user1.username}/to`)
            .send({ _token: token });

            expect(response.statusCode).toBe(401);
        });

        test("unauthenticated user can't get messages to user", async function () {
            let response = await request(app).get(`/users/${user1.username}/to`)
            expect(response.statusCode).toBe(401);
        });
    });

    describe("GET /users/:username/from", function () {
        test("can get messages from user", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test1", password: "password" });
            let token = await res.body.token;

            let response = await request(app).get(`/users/${user1.username}/from`)
            .send({ _token: token });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ messages: [{
                    id: msg1.id,
                    body: msg1.body,
                    sent_at: expect.any(String),
                    read_at: null,
                    to_user: {
                        first_name: user2.first_name,
                        last_name: user2.last_name,
                        phone: user2.phone,
                        username: user2.username
                    }
            }]});
        });

        test("unauthorized user can't get messages from user", async function () {
            let res = await request(app)
            .post("/auth/register")
            .send({
                username: "test3",
                password: "password",
                first_name: "Test",
                last_name: "Three",
                phone: "555-555-5555",
            });
            let token = res.body.token;

            let response = await request(app).get(`/users/${user1.username}/from`)
            .send({ _token: token });

            expect(response.statusCode).toBe(401);
        });

        test("unauthenticated user can't get messages from user", async function () {
            let response = await request(app).get(`/users/${user1.username}/from`)
            expect(response.statusCode).toBe(401);
        });
    });

    afterAll(async function () {
        await db.end();
    });

});