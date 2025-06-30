const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  tag: String,
  name: String,
  brawler: String,
});

const battleSchema = new mongoose.Schema(
  {
    battleTime: {
      type: Date,
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
    teams: {
      type: [[playerSchema]],
      required: true,
    },
    result: {
      winningTeam: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Battle", battleSchema);
