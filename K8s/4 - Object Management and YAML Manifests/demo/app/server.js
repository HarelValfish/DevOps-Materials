const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// The version string is the ONLY thing that changes between v1 and v2.
// Change "Version 1" -> "Version 2" when building the v2 image.
const VERSION = "Version 1";

app.get("/", (req, res) => {
  res.send(VERSION);
});

app.listen(PORT, () => {
  console.log(`version-app listening on port ${PORT} (${VERSION})`);
});
