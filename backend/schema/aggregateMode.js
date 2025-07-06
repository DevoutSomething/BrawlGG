const mongoose = require('mongoose');

const aggregateStatSchema = new mongoose.Schema({
  brawler: {
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

module.exports = mongoose.model('AggregateStat', aggregateStatSchema); 