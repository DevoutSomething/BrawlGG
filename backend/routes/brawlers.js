const express = require("express");
const router = express.Router();
require("dotenv").config();
const AggregateBrawler = require('../schema/aggregateBrawler');
const AggregateMap = require('../schema/aggregateMap');
const Battle = require('../schema/battle');
const { getTopPlayerIDs, processUser } = require('../helpers/ProcessData');

router.get("/", (req, res) => {
  res.json({ message: "Route avaliable" });
});

router.delete("/clear/all", async (req, res) => {
  try {
    await AggregateBrawler.deleteMany({});
    await AggregateMap.deleteMany({});
    await Battle.deleteMany({});
    res.json({ message: "All documents deleted from the collections" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong clearing" });
  }
});



router.post("/addTop", async (req, res) => {
  try {
    const topPlayerIDs = await getTopPlayerIDs();
    for(let i = 0; i < topPlayerIDs.length; i++){ 
      await processUser(topPlayerIDs[i]);
    }
    res.json({ message: "Top 50 players added" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong adding top players", error: err });
  }
});

module.exports = router;
