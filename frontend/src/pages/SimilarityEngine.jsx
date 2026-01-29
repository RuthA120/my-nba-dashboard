import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import "./SimilarityEngine.css";
import { fetchPlayers } from "../api/players";
import PlusSignImage from "../assets/plus-sign-img.png";
import GitHubLogo from "../assets/github-logo.webp";
import { RadarChart } from '@mui/x-charts/RadarChart';
import Loader from '../components/Loader.jsx';


export default function SimilarityEngine() {
  const [players, setPlayers] = useState([]);
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [playerStats, setPlayerStats] = useState({});
  const [activeSearch, setActiveSearch] = useState(null);
  const [query, setQuery] = useState("");
  const [similarity, setSimilarity] = useState(null);
  const [error, setError] = useState("");
  const [compareClicked, setCompareClicked] = useState(false);
  const [loading, setLoading] = useState(true);
  const radarMetrics = [
    "Points",
    "Rebounds",
    "Assists",
    "Steals",
    "Blocks",
    "3PT Attempts",
    "Paint\nAttempts",
    "Mid-FG\nAttempts",
    "Usage %"
  ];
  
  const maxValues = {
      points: 33.4,
      rebounds: 12.3,
      assists: 11,
      steals: 2.5,
      blocks: 2.7,
      threes_attempted: 11.9,
      paint_pts_attempted: 13.9,
      mid_fg_attempted: 6.5,
      usage_pct: .37,
  };

  const getPercent = (value, key) => {
    const max = maxValues[key] || 1;
    return `${Math.min((value / max) * 100, 100)}%`;
  };

  function StatBars({ stats, getPercent }) {
    const statConfig = [
      ["Points", "points"],
      ["Rebounds", "rebounds"],
      ["Assists", "assists"],
      ["Steals", "steals"],
      ["Blocks", "blocks"],
      ["3PT Att", "threes_attempted"],
      ["Paint Att", "paint_pts_attempted"],
      ["Mid FG Att", "mid_fg_attempted"],
      ["Usage %", "usage_pct"],
    ];

    return (
      <div className="player-stats">
        {statConfig.map(([label, key]) => (
          <div className="stat-row" key={key}>
            <span className="stat-label">{label}</span>

            <div className="stat-bar">
              <div
                className="stat-fill"
                style={{ width: getPercent(stats[key], key) }}
              />
            </div>

            <span className="stat-value">{stats[key]}</span>
          </div>
        ))}
      </div>
    );
  }


  const navigate = useNavigate();

  const imageUrl1 = player1
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${player1.id}.png`
    : null;

  const imageUrl2 = player2
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${player2.id}.png`
    : null;

  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true); // start loader
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/similarity-engine/load-players`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setPlayers(data);
      } catch {
        setError("Connection error");
      } finally {
        setLoading(false); 
      }
    };

    loadPlayers();
  }, [navigate]);


  const filteredPlayers = players.filter((p) =>
    p?.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (player) => {
    if (activeSearch === "player1") setPlayer1(player);
    if (activeSearch === "player2") setPlayer2(player);
    setActiveSearch(null);
    setQuery("");

    setCompareClicked(false); 
    setSimilarity(null);      
    setPlayerStats({});       
  };


  const calculateSimilarity = async () => {
    if (!player1 || !player2) {
      setError("Select two players first");
      return;
    }

    setError("");
    setSimilarity(null);
    setPlayerStats({});
    setCompareClicked(true); 

    try {
      const token = localStorage.getItem("token");

      const simRes = await fetch(
        `http://localhost:5000/similarity-engine?player1_id=${player1.id}&player2_id=${player2.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const simData = await simRes.json();
      if (simRes.ok) setSimilarity(simData.similarity_percent);
      else setError(simData.error || "Failed to fetch similarity");

      const statsRes = await fetch(
        `http://localhost:5000/similarity-engine/get-player-stats?player1_id=${player1.id}&player2_id=${player2.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        const statsMap = {};
        statsData.forEach((p) => {
          statsMap[p.id] = p;
        });
        setPlayerStats(statsMap);
      } else {
        setError("Failed to fetch player stats");
      }
    } catch {
      setError("Connection error");
    }
  };

  const getRadarData = () => {
    if (!player1 || !player2) return [];

    const metrics = [
      "points",
      "rebounds",
      "assists",
      "steals",
      "blocks",
      "threes_attempted",
      "paint_pts_attempted",
      "mid_fg_attempted",
      "usage_pct"
    ];

    const data = [];

    if (playerStats[player1.id]) {
      data.push({
        label: player1.name,
        data: metrics.map((m) => playerStats[player1.id][m] ?? 0),
      });
    }

    if (playerStats[player2.id]) {
      data.push({
        label: player2.name,
        data: metrics.map((m) => playerStats[player2.id][m] ?? 0),
      });
    }

    return data;
  };


  return (
    <div>
      <NavBar />
      <div className="engine-content">
        <header className="engine-header">
          <h1>NBA Player Similarity Engine</h1>
          <p>
            Compare statistical profiles between any two NBA players based on
            playstyle, usage, and shooting tendencies.
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
        </header>

        <section className="comparison-grid">
          {loading ? (
            <Loader /> 
          ) : (
            <>
          <div className="player-slot left">
            <button className={`player-circle ${playerStats[player1?.id] ? "small" : ""}`} onClick={() => setActiveSearch("player1")}>
              {player1 ? (
                <div className="player-content">
                  <img
                    src={imageUrl1}
                    alt={player1.name}
                    className={`similarity-player-image ${playerStats[player1?.id] ? "small" : ""}`}
                    onError={(e) => (e.target.src = PlusSignImage)}
                  />
                  <span className={`name-display ${playerStats[player1?.id] ? "small" : ""}`}>
                    {player1.name} (2026)
                  </span>

                  {playerStats[player1.id] && (
                    <StatBars
                      stats={playerStats[player1.id]}
                      getPercent={getPercent}
                    />
                  )}
                </div>
              ) : (
                <div className="add-prompt">
                  <img src={PlusSignImage} alt="+" />
                  <span>Select a player</span>
                </div>
              )}
            </button>
          </div>

          <div className="compare-slot">
            {!compareClicked && (
              <button className="compare-button" onClick={calculateSimilarity}>
                Compare
              </button>
            )}
          </div>


          <div className="player-slot right">
            <button className={`player-circle ${playerStats[player2?.id] ? "small" : ""}`} onClick={() => setActiveSearch("player2")}>
              {player2 ? (
                <div className="player-content">
                  <img
                    src={imageUrl2}
                    alt={player2.name}
                    className={`similarity-player-image ${playerStats[player2?.id] ? "small" : ""}`}
                    onError={(e) => (e.target.src = PlusSignImage)}
                  />
                  <span className={`name-display ${playerStats[player2?.id] ? "small" : ""}`}>
                    {player2.name} (2026)
                  </span>

                  {playerStats[player2.id] && (
                    <StatBars
                      stats={playerStats[player2.id]}
                      getPercent={getPercent}
                    />
                  )}
                </div>
              ) : (
                <div className="add-prompt">
                  <img src={PlusSignImage} alt="+" />
                  <span>Select a player</span>
                </div>
              )}
            </button>
          </div>
          </>
        )}
        </section>

        <section className="results-area">
          {error && <p className="error-msg">{error}</p>}
          {similarity !== null && (
            <div className="score-card">
              <span className="value">{similarity}%</span>
              <span className="label">Similarity</span>
            </div>
          )}

          {(playerStats[player1?.id] || playerStats[player2?.id]) && (
            <RadarChart
              height={330}
              series={getRadarData()}
              sx={{ mt: 3 }}
              width={310}
              radar={{ metrics: radarMetrics }}
            />
          )}
        </section>
      </div>

      {activeSearch && (
        <div className="modal-overlay" onClick={() => setActiveSearch(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Select {activeSearch === "player1" ? "First" : "Second"} Player
              </h3>
              <input
                autoFocus
                placeholder="Type player name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="modal-list">
              {filteredPlayers.length ? (
                filteredPlayers.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="list-item"
                    onClick={() => handleSelect(p)}
                  >
                    {p.name}
                  </div>
                ))
              ) : (
                <div className="no-results">No players found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
