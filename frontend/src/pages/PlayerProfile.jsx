import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { fetchPlayerById } from "../api/players";
import { favoritePlayer } from "../api/favorites";
import { removeFavoritePlayer } from "../api/favorites";
import NavBar from '../components/NavBar.jsx';
import FavoriteStar from '../assets/favorite-star.png';
import './PlayerProfile.css';

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        const data = await fetchPlayerById(id);
        setPlayer(data);

        if (data.stats.length > 0) {
          setSelectedSeason(data.stats[0].season);
        }
      } 
      catch (err) {
        if (err.status === 401) {
          navigate("/", { replace: true });
        } 
        else {
          console.error(err);
        }
      }
    };
  loadPlayer();
  }, [id, navigate]);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/players/is-favorite/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch favorite status");

        const data = await res.json();
        setIsFavorited(data.isFavorited);
      } catch (err) {
        console.error(err);
      }
    };

    checkFavorite();
  }, [id]);

  const handleFavoriteClick = async () => {
    try { 
      if (isFavorited == false){
        await favoritePlayer(id);
        setIsFavorited(true);
      }
      else{
        await removeFavoritePlayer(id);
        setIsFavorited(false);
      }
    } catch (err) {
      if (err.status === 401) {
        navigate("/", { replace: true });
      } else {
        console.error(err);
      }
    }
  };


  if (!player) return <p>Loading...</p>;

  const currentStats = player.stats.find(s => s.season === selectedSeason);

  const imageUrl = `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;

  return (
    <div>
      <NavBar />

      <div className="player-profile-picture">
        <img src={imageUrl} alt={player.name} className="player-profile-image" />
      </div>

      <div className="search-buttons">
        <Link to={"/teams-search"}>
          <div className="team-search-button">
            Back to Team Search
          </div>
        </Link>
        <Link to={"/players-search"} style={{textDecoration: "none"}}>
          <div className="player-search-button">
            Back to Player Search
          </div>
        </Link>
      </div>

      <div style={{ padding: "1rem", color:"black" }}>
        <h1 className="player-profile-first-name">{player.first_name}</h1>
        <h1 className="player-profile-last-name">{player.last_name}</h1>
        <p className="player-profile-team">{player.team}</p>
        <p className="player-profile-status">Status: {player.active ? "Active" : "Inactive"}</p>
        <div
            className={`favorite-status ${isFavorited ? "favorited" : ""}`}
            onClick={handleFavoriteClick}
          >
            <img className="favorite-star" src={FavoriteStar} />
            <h2 className="favorited-text">
              {isFavorited ? "Favorited" : "Favorite"}
            </h2>
        </div>



        <div className="season-stats-box">
          <div className="season-stats-header">
            <h2>Season Stats</h2>

            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="season-select"
            >
              {player.stats.map((s) => (
                <option key={s.season} value={s.season}>
                  {s.season}
                </option>
              ))}
            </select>
          </div>

          {currentStats && (
            <div className="stats-grid">
              <Stat label="PPG" value={currentStats.points} />
              <Stat label="REB" value={currentStats.rebounds} />
              <Stat label="AST" value={currentStats.assists} />
              <Stat label="STL" value={currentStats.steals} />
              <Stat label="BLK" value={currentStats.blocks} />
              <Stat label="TOV" value={currentStats.turnovers} />
              <Stat label="FG%" value={`${Math.round(currentStats.field_goal_pct * 100)}%`} />
              <Stat label="3P%" value={`${Math.round(currentStats.three_point_pct * 100)}%`} />
              <Stat label="FT%" value={`${Math.round(currentStats.free_throw_pct * 100)}%`} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
