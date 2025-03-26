import request from 'supertest';
import app from '../../app.js';  

describe("POST /users/login ", () => {
  it("should login successfully with valid credentials", async () => {
    const loginData = {
      email: "doe@mailinator.com",
      password: "password123",
    };

    const response = await request(app)
      .post('/api/v1/login')
      .send(loginData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toHaveProperty("id");
  });

  it("should return an error with invalid credentials", async () => {
    const loginData = {
      email: "doe@mailinator.com",
      password: "wrongpassword",
    };

    const response = await request(app)
      .post('/api/v1/login')
      .send(loginData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should return an error if email is missing", async () => {
    const loginData = {
      password: "password123",
    };

    const response = await request(app)
      .post('/api/v1/login')
      .send(loginData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please provide an email and password");
  });
});
