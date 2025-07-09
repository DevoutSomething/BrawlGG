const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  team1: [{
    type: String,
    required: true
  }],
  team2: [{
    type: String,
    required: true
  }],
  winner: {
    type: String,
    enum: ['team1', 'team2'],
    required: true
  },
  map: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Battle', battleSchema);
