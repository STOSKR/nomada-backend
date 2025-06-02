const request = require('supertest');
const TestHelper = require('./helpers/testHelper');

describe('Basic API Tests', () => {
  let testHelper;
  let app;

  beforeAll(async () => {
    testHelper = new TestHelper();
    app = await testHelper.setup();
  });

  afterAll(async () => {
    await testHelper.teardown();
  });

  describe('GET /', () => {
    it('should return hello world', async () => {
      const response = await request(app.server)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({ hello: 'world' });
    });
  });

  describe('API Health Check', () => {
    it('should respond to basic requests', async () => {
      const response = await request(app.server)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
