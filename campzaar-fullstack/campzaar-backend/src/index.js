require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));

app.get("/", (req, res) => {
  res.send("Server running");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});