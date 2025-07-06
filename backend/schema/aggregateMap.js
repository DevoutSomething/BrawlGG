const mongoose = require('mongoose');

const aggregateMapSchema = new mongoose.Schema({
  brawlers: { 
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

module.exports = mongoose.model('AggregateMap', aggregateMapSchema); 