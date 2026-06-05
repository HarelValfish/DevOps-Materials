const express = require('express');
const app = express();
const PORT = 3000;

const movies = [
  { title: 'Oppenheimer', genre: 'Drama', year: 2023 },
  { title: 'Dune: Part Two', genre: 'Sci-Fi', year: 2024 },
  { title: 'Past Lives', genre: 'Romance', year: 2023 },
  { title: 'Poor Things', genre: 'Fantasy', year: 2023 },
  { title: 'The Zone of Interest', genre: 'Drama', year: 2023 },
  { title: 'Anatomy of a Fall', genre: 'Thriller', year: 2023 },
  { title: 'All of Us Strangers', genre: 'Drama', year: 2023 },
  { title: 'Monster', genre: 'Drama', year: 2023 },
  { title: 'Saltburn', genre: 'Thriller', year: 2023 },
  { title: 'The Holdovers', genre: 'Comedy', year: 2023 },
];

app.get('/', (req, res) => {
  const movie = movies[Math.floor(Math.random() * movies.length)];
  res.json({
    version: 'v2',
    recommendation: movie,
    updatedAt: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: 'v2' });
});

app.listen(PORT, () => {
  console.log(`Movie Recommendation API v2 running on port ${PORT}`);
});
