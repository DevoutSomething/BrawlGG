const AggregateBrawler = require('../schema/aggregateBrawler');
const AggregateMap = require('../schema/aggregateMap');
const Battle = require('../schema/battle');
const threeVThreeSet = new Set(["gemGrab", "bounty", "basketBrawl", "knockout", "heist", "brawlBall"])
function normalizeTag(tag) {
  return tag.replace(/^#/, '').replace(/^23/, '').toUpperCase();
}

const getTopPlayerIDs = async () => { 
    let data;
    try {
        const response = await fetch(
        `${process.env.BRAWL_URL_RANKINGS}`,
        {
            headers: {
            Accept: "application/json",
            Authorization: `Bearer ${process.env.API_KEY_BRAWL}`,
            },
        }
        );
        data = await response.json();   
    }catch (error) {
        console.error("Error:", error);
    }
    if (!data) {
        throw new Error("Unable to fetch data");
    }
    let items = data.items;
    let playerIDs = [];
    for (let i = 0; i < items.length; i++) {
    let curID = "23" + items[i].tag.slice(1);
      playerIDs.push(curID);
    }
    return playerIDs;
}

const processUser = async (playerTag) => { 
    //get the top 100 battles for the user and process them depending on the mode
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
        throw new Error("user not found");
    }
    const data = await response.json();
    if (!data) {
        throw new Error("Unable to fetch data");
    }
    const items = data.items;
    for (let i = 0; i < items.length; i++) {
        const event = items[i].event;
        if (threeVThreeSet.has(event.mode)) {
            processBattle3v3(items[i], playerTag);
        }
        if (event.mode === "soloShowdown") {
            processBattleSoloShowdown(items[i], playerTag);
        }
    }
}

const processBattleSoloShowdown = (battleJSON) => { 
    const mode = "soloShowdown";
    const map = battleJSON.event.map;
    const players = battleJSON.battle.players;
    for (let i = 0; i < players.length; i++) {
        if (i <= 4){
            brawlerWin(players[i].brawler.name, map, mode);
        } else {
            brawlerLoss(players[i].brawler.name, map, mode);
        }
    }

}

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
            { brawler: brawlerName, map: map, mode: mode},
            { $inc: { wins: 1 } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`Error updating brawler win map and mode ${brawlerName}:`, error);
    }
}

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
            { brawler: brawlerName, map: map, mode: mode},
            { $inc: { losses: 1 } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`Error updating brawler loss map and mode ${brawlerName}:`, error);
    }
}




const processBattle3v3 = async (battleJSON, playerTag) => { 
    const battle = battleJSON.battle;
    const teams = battle.teams;
    const event = battleJSON.event;
    const {mode, map} = event;
    let win = false;
    if (battle.result === "victory") { 
        win = true;
    }

    let playerTeamIndex = -1;
    let playerInTeam = null;
    
    teams.forEach((team, teamIndex) => {
        const player = team.find(p => normalizeTag(p.tag) === normalizeTag(playerTag));
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
    if(winningTeamIndex === -1){
        console.log("No player found in the battle, something is wrong", teams[0], teams[1], playerTag);
        return;
    }

    
    // Process winning team
    const winningTeam = teams[winningTeamIndex];
    if (winningTeam && winningTeam.length > 0) {
        for (let i = 0; i < winningTeam.length; i++) {
            brawlerWin(winningTeam[i].brawler.name, map, mode);
        }
    } else {
        console.warn(`Winning team at index ${winningTeamIndex} is undefined or empty`);
    }
    
    // Process losing team
    const losingTeamIndex = winningTeamIndex === 0 ? 1 : 0;
    const losingTeam = teams[losingTeamIndex];
    if (losingTeam && losingTeam.length > 0) {
        for (let i = 0; i < losingTeam.length; i++) {
            brawlerLoss(losingTeam[i].brawler.name, map, mode);
        }
    } else {
        console.warn(`Losing team at index ${losingTeamIndex} is undefined or empty`);
    }
    //need to update the database based on the battle data
    if (teams[0] && teams[1]) {
        const team1Brawlers = teams[0].map(player => player.brawler.name);
        const team2Brawlers = teams[1].map(player => player.brawler.name);
        const winner = winningTeamIndex === 0 ? 'team1' : 'team2';
        
        const battleData = new Battle({
            team1: team1Brawlers,
            team2: team2Brawlers,
            winner: winner,
            map: map,
            mode: mode
        });
        await battleData.save();
    } else {
        console.warn('Cannot save battle data: one or both teams are undefined');
    }
}

const getTotalBrawlerWins = async (brawlerName) => {
    const brawler = await AggregateBrawler.findOne({ brawler: brawlerName });
    return brawler.wins;
}
const getTotalBrawlerLosses = async (brawlerName) => {
    const brawler = await AggregateBrawler.findOne({ brawler: brawlerName });
    return brawler.losses;
}

const getTotalBrawlerWinsMap = async (brawlerName, map) => {
    const mapsInModes = await AggregateMap.find({ brawler: brawlerName, map: map });
    let totalWins = 0;
    for(let i =0; i < mapsInModes.length; i++){ 
        totalWins += mapsInModes[i].wins;
    }
    return totalWins;    
}
const getTotalBrawlerLossesMap = async (brawlerName, map) => {
    const mapsInModes = await AggregateMap.find({ brawler: brawlerName, map: map });
    let totalLosses = 0;
    for(let i =0; i < mapsInModes.length; i++){ 
        totalLosses += mapsInModes[i].losses;
    }
    return totalLosses;
}

module.exports = {
    processBattle3v3,
    getTopPlayerIDs,
    processUser,
    getTotalBrawlerWins,
    getTotalBrawlerLosses,
    getTotalBrawlerWinsMap,
    getTotalBrawlerLossesMap
}