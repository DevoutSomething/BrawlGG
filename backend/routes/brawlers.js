const express = require("express");
const router = express.Router();
require("dotenv").config();
const AggregateBrawler = require('../schema/aggregateBrawler');

router.get("/", (req, res) => {
  res.json({ message: "Route avaliable" });
});

router.delete("/clear/all", async (req, res) => {
  try {
    await Brawler.deleteMany({});
    res.json({ message: "All documents deleted from the collection" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong clearing" });
  }
});






router.post("/addTopFifty", async (req, res) => {

});
module.exports = router;
