const express = require("express");
const router = express.Router();
require("dotenv").config();
const AggregateBrawler = require('../schema/aggregateBrawler');
const AggregateMap = require('../schema/aggregateMap');
const Battle = require('../schema/battle');
const { getTopPlayerIDs, processUser, getTotalBrawlerWins, getTotalBrawlerLosses, getTotalBrawlerWinsMode, getTotalBrawlerLossesMode } = require('../helpers/ProcessData');

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

router.get("/getBrawlerStats", async (req, res) => {
  try {
    const { brawler } = req.query;
    
    if (!brawler) {
      return res.status(400).json({ message: "Brawler field is required" });
    }
    const brawlerWins = await getTotalBrawlerWins(brawler);
    const brawlerLosses = await getTotalBrawlerLosses(brawler);
    res.json({ message: "Brawler stats retrieved successfully", data: {brawlerWins, brawlerLosses} });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong getting brawler stats", error: err });
  }
});

router.get("/getBrawlerStatsMode", async (req, res) => {
  try {
    const { brawler, mode } = req.query;
    
    if (!brawler || !mode) {
      return res.status(400).json({ message: "Brawler field is required" });
    }
    const brawlerWins = await getTotalBrawlerWinsMode(brawler, mode);
    const brawlerLosses = await getTotalBrawlerLossesMode(brawler, mode);
    res.json({ message: "Brawler stats retrieved successfully mode", data: {brawlerWins, brawlerLosses} });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong getting brawler stats", error: err });
  }
});

module.exports = router;
