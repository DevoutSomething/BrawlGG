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
        if (event.mode === "brawlBall") {
            processBattle3v3(items[i], playerTag);
        }
    }
}

const processBattleSoloShowdown = (battleJSON) => { 
    const mode = "soloShowdown";
    const map = battleJSON.event.map;
    const players = battleJSON.battle.players;
    for (let i = 0; i < players.length; i++) {
        if (i <= 4){
            brawlerWin(players[i].name, map, mode);
        } else {
            brawlerLoss(players[i].name, map, mode);
        }
    }

}

const brawlerWin = (brawlerName, map, mode) => { 
    //update the database with the brawler win
}

const brawlerLoss = (brawlerName, map, mode) => { 
    //update the database with the brawler loss
}
const processBattle3v3 = (battleJSON, playerTag) => { 
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
        const player = team.find(p => p.tag === playerTag);
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

    //need to update the database based on the battle data
    
}

module.exports = {
    getBattlesFromPlayerID,
    processBattle3v3
}