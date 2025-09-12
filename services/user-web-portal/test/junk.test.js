const request = require('supertest');
const app = require('../server');
const { expect } = require('chai');

describe('GET /junk', () => {
  it('should not hang on malicious regex', (done) => {
    const maliciousRegex = 'a'.repeat(25) + 'b';
    request(app)
      .get(`/junk?search=${maliciousRegex}`)
      .timeout(1000) // 1 second timeout
      .end((err, res) => {
        if (err && err.timeout) {
          done(new Error('Request timed out, possible ReDoS vulnerability.'));
        } else {
          expect(res.status).to.not.equal(500);
          done();
        }
      });
  }).timeout(2000);
});
