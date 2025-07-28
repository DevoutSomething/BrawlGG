const AggregateBrawler = require("../schema/aggregateBrawler");
const AggregateMap = require("../schema/aggregateMap");
const Battle = require("../schema/battle");
const threeVThreeSet = new Set([
  "gemGrab",
  "bounty",
  "basketBrawl",
  "knockout",
  "heist",
  "brawlBall",
]);
function normalizeTag(tag) {
  return tag.replace(/^#/, "").replace(/^23/, "").toUpperCase();
}

const getTopPlayerIDs = async () => {
  let data;
  try {
    const response = await fetch(`${process.env.BRAWL_URL_RANKINGS}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY_BRAWL}`,
      },
    });
    data = await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
  if (!data) {
    throw new Error("Unable to fetch data");
  }
  let items = data.items;
  let playerIDs = [];
  for (let i = 0; i < items.length; i++) {
    playerIDs.push(items[i].tag);
  }
  return playerIDs;
};

const getOneTopPlayerID = async () => {
  let data;
  try {
    const response = await fetch(`${process.env.BRAWL_URL_RANKINGS}?limit=1`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY_BRAWL}`,
      },
    });
    data = await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
  if (!data) {
    throw new Error("Unable to fetch data");
  }
  let items = data.items;
  let playerID = items[0].tag;
  return playerID;
};

const processUser = async (playerTag) => {
  let modifiedTag = "23" + playerTag.slice(1);

  const response = await fetch(
    `${process.env.BRAWL_URL_PLAYERS}%${modifiedTag}/battlelog`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY_BRAWL}`,
        "Cache-Control": "max-age=60",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`User not found or API error: ${response.status}`);
  }
  const data = await response.json();
  if (!data) {
    throw new Error("Unable to fetch data");
  }
  const items = data.items;
  for (let i = 0; i < items.length; i++) {
    const event = items[i].event;
    if (threeVThreeSet.has(event.mode)) {
      await processBattle3v3(items[i], playerTag);
    }
    if (event.mode === "soloShowdown") {
      processBattleSoloShowdown(items[i], playerTag);
    }
    if (event.mode === "trioShowdown" || event.mode === "duoShowdown") {
      processDuoShowdown(items[i], playerTag);
    }
  }
};

const processBattleSoloShowdown = (battleJSON) => {
  const mode = "SOLOSHOWDOWN";
  const map = battleJSON.event.map.toUpperCase();
  const players = battleJSON.battle.players;
  for (let i = 0; i < players.length; i++) {
    if (i <= 4) {
      brawlerWin(players[i].brawler.name, map, mode);
    } else {
      brawlerLoss(players[i].brawler.name, map, mode);
    }
  }
};

const processDuoShowdown = (battleJSON, currentID) => {
  const mode = "DUOSHOWDOWN";
  const map = battleJSON.event.map.toUpperCase();
  const teams = battleJSON.battle.teams;
  let winningIndex = -1;
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams[i].length; j++) {
      let currentTeam = teams[i];
      if (currentTeam[j].tag === currentID) {
        winningIndex = i;
        break;
      }
    }
    if (winningIndex != -1) {
      break;
    }
  }

  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams[i].length; j++) {
      let player = teams[i][j];
      if (i === winningIndex) {
        brawlerWin(player.brawler.name, map, mode);
      } else {
        brawlerLoss(player.brawler.name, map, mode);
      }
    }
  }
};
const brawlerWin = async (brawlerName, map, mode) => {
  try {
    await AggregateBrawler.findOneAndUpdate(
      { brawler: brawlerName },
      { $inc: { wins: 1 } },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Error updating brawler win for ${brawlerName}:`, error);
  }
  try {
    await AggregateMap.findOneAndUpdate(
      { brawler: brawlerName, map: map, mode: mode },
      { $inc: { wins: 1 } },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(
      `Error updating brawler win map and mode ${brawlerName}:`,
      error
    );
  }
};

const brawlerLoss = async (brawlerName, map, mode) => {
  try {
    await AggregateBrawler.findOneAndUpdate(
      { brawler: brawlerName },
      { $inc: { losses: 1 } },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Error updating brawler loss for ${brawlerName}:`, error);
  }
  try {
    await AggregateMap.findOneAndUpdate(
      { brawler: brawlerName, map: map, mode: mode },
      { $inc: { losses: 1 } },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(
      `Error updating brawler loss map and mode ${brawlerName}:`,
      error
    );
  }
};

const processBattle3v3 = async (battleJSON, playerTag) => {
  const battle = battleJSON.battle;
  const teams = battle.teams;
  const event = battleJSON.event;
  const { mode, map } = event;
  const upperMode = mode.toUpperCase();
  const upperMap = map.toUpperCase();
  let win = false;
  if (battle.result === "victory") {
    win = true;
  }

  let playerTeamIndex = -1;
  let playerInTeam = null;

  teams.forEach((team, teamIndex) => {
    const player = team.find(
      (p) => normalizeTag(p.tag) === normalizeTag(playerTag)
    );
    if (player) {
      playerTeamIndex = teamIndex;
      playerInTeam = player;
    }
  });

  let winningTeamIndex = -1;
  if (win) {
    winningTeamIndex = playerTeamIndex;
  } else {
    winningTeamIndex = playerTeamIndex === 0 ? 1 : 0;
  }
  if (winningTeamIndex === -1) {
    console.log(
      "No player found in the battle, something is wrong",
      teams[0],
      teams[1],
      playerTag
    );
    return;
  }

  // Process winning team
  const winningTeam = teams[winningTeamIndex];
  if (winningTeam && winningTeam.length > 0) {
    for (let i = 0; i < winningTeam.length; i++) {
      brawlerWin(winningTeam[i].brawler.name, upperMap, upperMode);
    }
  } else {
    console.warn(
      `Winning team at index ${winningTeamIndex} is undefined or empty`
    );
  }

  // Process losing team
  const losingTeamIndex = winningTeamIndex === 0 ? 1 : 0;
  const losingTeam = teams[losingTeamIndex];
  if (losingTeam && losingTeam.length > 0) {
    for (let i = 0; i < losingTeam.length; i++) {
      brawlerLoss(losingTeam[i].brawler.name, upperMap, upperMode);
    }
  } else {
    console.warn(
      `Losing team at index ${losingTeamIndex} is undefined or empty`
    );
  }
  //need to update the database based on the battle data
  if (teams[0] && teams[1]) {
    const team1Brawlers = teams[0]
      .filter((player) => player && player.brawler && player.brawler.name)
      .map((player) => player.brawler.name);
    const team2Brawlers = teams[1]
      .filter((player) => player && player.brawler && player.brawler.name)
      .map((player) => player.brawler.name);

    if (team1Brawlers.length !== 3 || team2Brawlers.length !== 3) {
      console.warn("Invalid team size or missing brawler names:", {
        team1: teams[0],
        team2: teams[1],
        team1Brawlers,
        team2Brawlers,
        battleJSON,
      });
      return; // skip saving this battle
    }

    const winner = winningTeamIndex === 0 ? "team1" : "team2";

    const battleData = new Battle({
      team1: team1Brawlers,
      team2: team2Brawlers,
      winner: winner,
      map: upperMap,
      mode: upperMode,
    });
    await battleData.save();
  } else {
    console.warn("Cannot save battle data: one or both teams are undefined");
  }
};

const getTotalBrawlerWins = async (brawlerName) => {
  brawlerName = brawlerName.toUpperCase();
  const brawler = await AggregateBrawler.findOne({ brawler: brawlerName });
  return brawler.wins;
};
const getTotalBrawlerLosses = async (brawlerName) => {
  brawlerName = brawlerName.toUpperCase();
  const brawler = await AggregateBrawler.findOne({ brawler: brawlerName });
  return brawler.losses;
};

const getTotalBrawlerWinsMode = async (brawlerName, mode) => {
  brawlerName = brawlerName.toUpperCase();
  mode = mode.toUpperCase();
  const mapsInModes = await AggregateMap.find({
    brawler: brawlerName,
    mode: mode,
  });
  let totalWins = 0;
  for (let i = 0; i < mapsInModes.length; i++) {
    totalWins += mapsInModes[i].wins;
  }
  return totalWins;
};
const getTotalBrawlerLossesMode = async (brawlerName, mode) => {
  brawlerName = brawlerName.toUpperCase();
  mode = mode.toUpperCase();
  const mapsInModes = await AggregateMap.find({
    brawler: brawlerName,
    mode: mode,
  });
  let totalLosses = 0;
  for (let i = 0; i < mapsInModes.length; i++) {
    totalLosses += mapsInModes[i].losses;
  }
  return totalLosses;
};

const addMassToDB = async () => {
  let seen = new Set();
  let unSeen = [];
  const playersToProcess = 5000;
  let curPlayerID = await getOneTopPlayerID();
  seen.add(curPlayerID);
  for (let i = 0; i < playersToProcess; i++) {
    console.log(i);
    let modifitedPlayerID = "23" + curPlayerID.slice(1);
    const lastBattle = await processUserReturnLastBattle(modifitedPlayerID);
    if (lastBattle.event.mode === "soloShowdown") {
    }
    if (threeVThreeSet.has(lastBattle.event.mode)) {
      const team1 = lastBattle.battle.teams[0];
      const team2 = lastBattle.battle.teams[1];
      for (let j = 0; j < team1.length; j++) {
        if (!seen.has(team1[j].tag)) {
          unSeen.push(team1[j].tag);
        }
        if (!seen.has(team2[j].tag)) {
          unSeen.push(team2[j].tag);
        }
      }
    }
    seen.add(curPlayerID);
    console.log(curPlayerID + " finished processing");
    curPlayerID = unSeen.pop();
  }
};

const processUserReturnLastBattle = async (playerTag) => {
  const response = await fetch(
    `${process.env.BRAWL_URL_PLAYERS}%${playerTag}/battlelog`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.API_KEY_BRAWL}`,
        "Cache-Control": "max-age=60",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`User not found or API error: ${response.status}`);
  }
  const data = await response.json();
  if (!data) {
    throw new Error("Unable to fetch data");
  }
  const items = data.items;
  for (let i = 0; i < items.length; i++) {
    const event = items[i].event;
    if (threeVThreeSet.has(event.mode)) {
      await processBattle3v3(items[i], playerTag);
    }
    if (event.mode === "soloShowdown") {
      processBattleSoloShowdown(items[i], playerTag);
    }
  }
  return items[items.length - 1];
};
module.exports = {
  processBattle3v3,
  getTopPlayerIDs,
  processUser,
  getTotalBrawlerWins,
  getTotalBrawlerLosses,
  getTotalBrawlerWinsMode,
  getTotalBrawlerLossesMode,
  addMassToDB,
};
