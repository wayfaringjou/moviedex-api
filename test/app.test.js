require('dotenv').config();
const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../app');

const token = process.env.API_TOKEN;

describe('GET /movie', () => {
  // The API responds with an array of full movie entries for the search results
  it('should respond with an array of full movie entries for the search results', () => supertest(app)
    .get('/movie')
    .set({ Authorization: `Bearer ${token}` })
    .expect(200)
    .expect('Content-Type', /json/)
    .then((res) => {
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf.at.least(1);
      const movie = res.body[0];
      expect(movie).to.include.all.keys(
        'filmtv_ID',
        'film_title',
        'year',
        'genre',
        'duration',
        'country',
        'director',
        'actors',
        'avg_vote',
        'votes',
      );
    }));

  // Users can search for movies by genre, country or avg_vote
  it('should respond 400 for queries not including genre, country or avg_vote', () => supertest(app)
    .get('/movie')
    .set({ Authorization: `Bearer ${token}` })
    .query({ MISTAKE: 'error' })
    .expect(400));

  it('should respond to allowed queries with array', () => supertest(app)
    .get('/movie')
    .set({ Authorization: `Bearer ${token}` })
    .query({ genre: 'comedy', country: 'united states', avg_vote: '5' })
    .expect(200)
    .expect('Content-Type', /json/)
    .then((res) => {
      expect(res.body).to.be.an('array');
    }));

  // When searching by genre, users are searching
  // for whether the Movie's genre includes a specified string.
  // The search should be case insensitive.
  it("should respond to 'genre' queries with array of movies including 'genre'", () => supertest(app)
    .get('/movie')
    .set({ Authorization: `Bearer ${token}` })
    .query({ genre: 'comedy', country: 'italy' })
    .expect(200)
    .expect('Content-Type', /json/)
    .then((res) => {
      expect(res.body).to.be.an('array');
      let filtered = true;

      let i = 0;
      while (i < res.body.length - 1) {
        if (!res.body[i].genre.includes('Comedy')) {
          filtered = false;
          break;
        }
        i += 1;
      }
      expect(filtered).to.be.true;
    }));

  it("should respond to 'country' queries with array of movies including 'country'", () => supertest(app)
    .get('/movie')
    .set({ Authorization: `Bearer ${token}` })
    .query({ country: 'united states' })
    .expect(200)
    .expect('Content-Type', /json/)
    .then((res) => {
      expect(res.body).to.be.an('array');
      let filtered = true;

      let i = 0;
      while (i < res.body.length - 1) {
        if (!res.body[i].country.includes('United States')) {
          filtered = false;
          break;
        }
        i += 1;
      }
      expect(filtered).to.be.true;
    }));

  it("should respond to 'avg_vote' queries with movies that have that vote score or higher", () => supertest(app)
    .get('/movie')
    .set({ Authorization: `Bearer ${token}` })
    .query({ avg_vote: 5 })
    .expect(200)
    .expect('Content-Type', /json/)
    .then((res) => {
      expect(res.body).to.be.an('array');
      let filtered = true;

      let i = 0;
      while (i < res.body.length - 1) {
        if (res.body[i].avg_vote < 5) {
          filtered = false;
          break;
        }
        i += 1;
      }
      expect(filtered).to.be.true;
    }));

  it('should implement CORS', async () => {
    const { headers } = await supertest(app)
      .get('/movie')
      .set({ Authorization: `Bearer ${token}` });
    expect(headers['access-control-allow-origin']).to.equal('*');
  });

  it('should not publish powered-by Express', async () => {
    const { headers } = await supertest(app)
      .get('/movie')
      .set({ Authorization: `Bearer ${token}` });
    expect(headers['x-powered-by']).to.not.equal('Express');
  });
});
