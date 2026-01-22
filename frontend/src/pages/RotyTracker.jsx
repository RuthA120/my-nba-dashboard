import { useEffect, useState } from "react";
import { fetchTop5Rookies } from "../api/models";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import "./RotyTracker.css";
import GitHubLogo from "../assets/github-logo.webp";


function PlayerCard({ player, rank }) {
  const rankClass =
    rank === 1 ? "roty-first" :
    rank === 2 ? "roty-second" :
    rank === 3 ? "roty-third" :
    "roty-other";

  return (
    <div className={`roty-card ${rankClass}`}>
      <div className="roty-rank">#{rank}</div>

      <img
        src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`}
        alt={player.full_name}
        className="roty-img"
      />

      <h2>{player.full_name}</h2>
      <p className="roty-team">{player.team_name}</p>

      <div className="roty-prob">
        {(player.roty_prob * 100).toFixed(1)}%
        <span>ROTY Probability</span>

      </div>

      <div className="roty-stats">
        <div><strong>PTS</strong><span>{player.PTS}</span></div>
        <div><strong>REB</strong><span>{player.TRB}</span></div>
        <div><strong>AST</strong><span>{player.AST}</span></div>
        <div><strong>STL</strong><span>{player.STL}</span></div>
        <div><strong>BLK</strong><span>{player.BLK}</span></div>
      </div>
    </div>
  );
}


export default function RotyTracker() {
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await fetchTop5Rookies();
        setPlayers(data);
      } catch {
        navigate("/");
      }
    };

    loadPlayers();
  }, [navigate]);

  return (
    <div>
      <NavBar />

      <div className="roty-container">
        {/* Header Section */}
        <div className="roty-header">
        <h1>ROTY Live Predictor</h1>

        <p>
          This model predicts the NBA Rookie of the Year race in real time
          using player performance metrics, on-court impact, and historical
          award trends. Probabilities update as the season progresses.
        </p>

        <a
          href="https://github.com/YOUR_USERNAME/roty-model"
          target="_blank"
          rel="noopener noreferrer"
          className="roty-github-link"
        >
          <img src={GitHubLogo} alt="GitHub" />
          <span>View Model Breakdown</span>
        </a>
      </div>


        {/* Cards */}
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
    </div>
  );
}
