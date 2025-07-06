const getBattlesFromPlayerID = async (playerID) => { 

    let data;
    let map = new Map();
    totalBattles = 0;
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
    for (let i = 0; i < items.length; i++) {
      let curID = items[i].tag
      await processUser(curID);
    }
}

const processUser = async (playerTag) => { 
    //get the top 100 battles for the user and process them depending on the mode
}


const processBattle3v3 = (battleJSON, playerTag) => { 
    const items = battleJSON.items;
    const battle = items.battle;
    const teams = items.teams;
    const event = battle.event;
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