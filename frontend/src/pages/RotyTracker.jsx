import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTop5Rookies } from "../api/models";
import NavBar from "../components/NavBar";
import "./RotyTracker.css";

function PlayerCard({ player, rank }) {
  const rankClass =
    rank === 1 ? "roty-first" :
    rank === 2 ? "roty-second" :
    rank === 3 ? "roty-third" :
    "roty-other";

  return (
    <div className={`roty-card ${rankClass}`}>
      <img
        src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`}
        alt={player.full_name}
        className="roty-img"
      />

      <h2>
        {player.full_name}
      </h2>

      <p>{player.team_name}</p>

      <div className="roty-prob">
        ROTY Chance: {(player.roty_prob * 100).toFixed(1)}%
      </div>

      <div className="roty-stats">
        <p>PTS: {player.PTS}</p>
        <p>REB: {player.TRB}</p>
        <p>AST: {player.AST}</p>
        <p>STL: {player.STL}</p>
        <p>BLK: {player.BLK}</p>
      </div>
    </div>
  );
}


export default function RotyTracker() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetchTop5Rookies().then(setPlayers);
  }, []);


  return (
    <div>
      <NavBar />
        <div className="roty-grid">
            {players.map((player, index) => (
                <PlayerCard
                    key={player.id}
                    player={player}
                    rank={index + 1}   
                />
            ))}
        </div>

    </div>
  );
}
