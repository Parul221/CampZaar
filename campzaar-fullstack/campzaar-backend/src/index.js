require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const passport = require("./config/passport");
const { setupWebSocket } = require("./websocket/wsServer");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Serve static files (images, etc)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/startups", require("./routes/startups"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/otps", require("./routes/otps"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/users", require("./routes/users"));

app.get("/", (req, res) => {
  res.send("Server running");
});

const wss = setupWebSocket(server);

const PORT = Number(process.env.PORT || 4000);

server.on('error', (err) => {
  console.error('Server error:', err && err.message ? err.message : err);
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use — make sure no other instance is running`);
  }
});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

function shutdown() {
  console.log('Shutting down server...');
  try { server.close(); } catch (e) {}
  try { if (wss && typeof wss.close === 'function') wss.close(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown();
});
