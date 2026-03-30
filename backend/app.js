const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");

const adminRoutes = require("./routes/adminRoutes");
const voterRoutes = require("./routes/voterRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/admin", adminRoutes);
app.use("/api/voter", voterRoutes);
app.use("/api/public", publicRoutes);
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API route not found.",
      error: "Invalid endpoint."
    });
  }

  return res.status(404).send("<h1>Page not found</h1>");
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: error.message
  });
});

module.exports = app;
