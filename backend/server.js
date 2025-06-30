require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const port = 4220;

mongoose.connect(process.env.DATABASE_URL_NONLOCAL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (err) => console.error("DB connection error:", err));
db.once("open", () => console.log("✅ Connected to database"));

app.use(express.json());

const brawlersRouter = require("./routes/brawlers");
app.use("/brawlers", brawlersRouter);

app.listen(port, () => {
  console.log(`Server has started on http://localhost:${port}`);
});
