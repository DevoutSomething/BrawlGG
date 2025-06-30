const mongoose = require("mongoose");

const aggregateSchema = new mongoose.Schema({
  brawler: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  map: {
    type: String,
    required: true,
  },
  matchesPlayed: {
    type: Number,
    required: true,
  },
  wins: {
    type: Number,
    required: true,
  },
  winrate: {
    type: Number,
    required: true,
  },
  pickrate: {
    type: Number,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Aggregate", aggregateSchema);
