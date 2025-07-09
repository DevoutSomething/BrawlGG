const mongoose = require('mongoose');

const aggregateMapSchema = new mongoose.Schema({
  brawler: { 
    type: String,
    required: true
  },
  map: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: true
  },
  wins: {
    type: Number,
    required: true,
    default: 0
  },
  losses: {
    type: Number,
    required: true,
    default: 0
  }
});

// Add compound unique index for brawler, map, and mode combination
aggregateMapSchema.index({ brawler: 1, map: 1, mode: 1 }, { unique: true });

module.exports = mongoose.model('AggregateMap', aggregateMapSchema); 