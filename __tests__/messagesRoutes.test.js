const request = require("supertest");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");
const User = require("../models/user");

let user1, user2, msg1, msg2;


describe("Messages Routes Test", function () {

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

    describe("GET /messages/:id", function () {
        test("get details of message", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test1", password: "password" });
            let token = res.body.token;

            let response = await request(app).get(`/messages/${msg1.id}`)
            .send({ _token: token });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                    message: {
                      id: msg1.id,
                      body: msg1.body,
                      sent_at: expect.any(String),
                      read_at: null,
                      from_user: {
                        username: user1.username,
                        first_name: user1.first_name,
                        last_name: user1.last_name,
                        phone: user1.phone
                      },
                      to_user: {
                        username: user2.username,
                        first_name: user2.first_name,
                        last_name: user2.last_name,
                        phone: user2.phone
                      }
            }});
        });

        test("unauthorized user can't get details of message", async function () {
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

            let response = await request(app).get(`/messages/${msg1.id}`)
            .send({ _token: token });

            expect(response.statusCode).toBe(401);
        });

        test("unauthenticated user can't get details of message", async function () {
            let response = await request(app).get(`/messages/${msg1.id}`);
            expect(response.statusCode).toBe(401);
        });
    });

    describe("POST /messages/", function () {
        test("can post a message", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test1", password: "password" });
            let token = await res.body.token;

            let response = await request(app).post(`/messages/`)
            .send({ 
                to_username: user2.username,
                body: 'Hello',
                _token: token 
            });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ message: {
                id: expect.any(Number),
                from_username: user1.username,
                to_username: user2.username,
                body: 'Hello',
                sent_at: expect.any(String)
            }});
        });

        test("unauthenticated user can't post a message", async function () {
            let response = await request(app).post(`/messages/`)
            .send({ 
                to_username: user2.username,
                body: 'Hello'
            });
            expect(response.statusCode).toBe(401);
        });
    });

    describe("POST /messages/:id/read", function () {
        test("can mark message as read", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test1", password: "password" });
            let token = await res.body.token;

            let response = await request(app).post(`/messages/${msg2.id}/read`)
            .send({ _token: token });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ message: {
                results: { id: msg2.id, read_at: expect.any(String) }
            }});
        });

        test("unauthorized user can't mark message as read", async function () {
            let res = await request(app)
            .post("/auth/login")
            .send({ username: "test2", password: "password" });
            let token = await res.body.token;

            let response = await request(app).post(`/messages/${msg2.id}/read`)
            .send({ _token: token });

            expect(response.statusCode).toBe(401);
        });

        test("unauthenticated user can't mark message as read", async function () {
            let response = await request(app).post(`/messages/${msg2.id}/read`)
            expect(response.statusCode).toBe(401);
        });
    });

    afterAll(async function () {
        await db.end();
    });

});