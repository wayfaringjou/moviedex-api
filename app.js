require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const MOVIES = require('./movies-data-small.json');

const app = express();

const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting));
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res
      .status(401).json({ error: 'Unauthorized request' });
  }
  next();
});

function filterByString(array, keyName, string) {
  return array
    .filter((item) => item[keyName].toLowerCase()
      .includes(string.toLowerCase()));
}

function filterByNumber(array, keyName, number) {
  return array
    .filter((item) => Number(item[keyName]) >= Number(number));
}

function handleGetMovies(req, res) {
  let response = MOVIES;
  const allowedQueries = ['genre', 'country', 'avg_vote'];
  const submittedQueries = Object.keys(req.query);

  if (submittedQueries.length) {
    if (submittedQueries.filter((query) => allowedQueries.includes(query)).length === 0) {
      return res
        .status(400)
        .send("Queries must be 'genre', 'country' or 'avg_vote'.");
    }

    const { genre, country, avg_vote } = req.query;

    if (genre) {
      response = filterByString(response, 'genre', genre.toLowerCase());
    }

    if (country) {
      response = filterByString(response, 'country', country.toLowerCase());
    }

    if (avg_vote) {
      response = filterByNumber(response, 'avg_vote', avg_vote);
    }
  }

  return res.json(response);
}

app.get('/movie', handleGetMovies);

app.use((error, req, res, next) => {
  let response;
  if (process.env.NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    response = { error };
  }
  res.status(500).json(response);
});

module.exports = app;
