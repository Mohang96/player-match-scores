const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  const updatedPlayersArray = playersArray.map((playerObject) => {
    const updatedPlayerObject = {
      playerId: playerObject.player_id,
      playerName: playerObject.player_name,
    };
    return updatedPlayerObject;
  });
  response.send(updatedPlayersArray);
});

//GET Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  const updatedPlayer = {
    playerId: player.player_id,
    playerName: player.player_name,
  };
  response.send(updatedPlayer);
});

//UPDATE Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//GET Specific Match Details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  const updatedMatchDetails = {
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  };
  response.send(updatedMatchDetails);
});

//GET All Matches of a Player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesQuery = `
    SELECT
      match_details.match_id AS matchId,
      match_details.match,
      match_details.year
    FROM
      match_details INNER JOIN player_match_score
      ON match_details.match_id = player_match_score.match_id
    WHERE
      player_match_score.player_id = ${playerId};`;
  const allMatchesArray = await db.all(getAllMatchesQuery);
  response.send(allMatchesArray);
});

//GET Players of a Match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName
    FROM
      player_details INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
    WHERE
      player_match_score.match_id = ${matchId};`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

//GET Statistics of a Player API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatisticsQuery = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes
    FROM
      player_details INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
    WHERE
      player_match_score.player_id = ${playerId};`;
  const playerStatistics = await db.get(getPlayerStatisticsQuery);
  response.send(playerStatistics);
});

module.exports = app;
