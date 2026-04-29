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
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/users", require("./routes/users"));

app.get("/", (req, res) => {
  res.send("Server running");
});

setupWebSocket(server);

const PORT = Number(process.env.PORT || 4001);
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
