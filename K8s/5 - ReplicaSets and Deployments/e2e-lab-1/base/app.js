const express = require('express');
const app = express();
const PORT = 3000;

const movies = [
  { title: 'The Shawshank Redemption', genre: 'Drama', year: 1994 },
  { title: 'The Godfather', genre: 'Crime', year: 1972 },
  { title: 'The Dark Knight', genre: 'Action', year: 2008 },
  { title: 'Pulp Fiction', genre: 'Crime', year: 1994 },
  { title: 'Forrest Gump', genre: 'Drama', year: 1994 },
  { title: 'Inception', genre: 'Sci-Fi', year: 2010 },
  { title: 'The Matrix', genre: 'Sci-Fi', year: 1999 },
  { title: 'Interstellar', genre: 'Sci-Fi', year: 2014 },
  { title: 'Goodfellas', genre: 'Crime', year: 1990 },
  { title: 'Fight Club', genre: 'Drama', year: 1999 },
];

app.get('/', (req, res) => {
  const movie = movies[Math.floor(Math.random() * movies.length)];
  res.json({
    version: 'v1',
    recommendation: movie,
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Movie Recommendation API v1 running on port ${PORT}`);
});
