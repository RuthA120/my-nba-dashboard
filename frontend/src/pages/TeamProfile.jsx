import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { fetchTeamById } from "../api/teams";
import { favoriteTeam } from "../api/favorites";
import { removeFavoriteTeam } from "../api/favorites";
import NavBar from '../components/NavBar.jsx';
import FavoriteStar from '../assets/favorite-star.png';
import PlayerCard from '../components/PlayerCard.jsx';
import './TeamProfile.css';

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="team-stat-value">{value}</div>
      <div className="team-stat-label">{label}</div>
    </div>
  );
}

export default function TeamProfile() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [roster, setRoster] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedSeason) return;

    const fetchRoster = async () => {
        try {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `http://localhost:5000/api/teams/${id}/roster?season=${selectedSeason}`,
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );

        if (!res.ok) throw new Error("Failed to fetch roster");

        const data = await res.json();
        setRoster(data);
        } catch (err) {
        console.error(err);
        }
    };

    fetchRoster();
    }, [id, selectedSeason]);



  useEffect(() => {
    const loadTeam = async () => {
      try {
        const data = await fetchTeamById(id);
        setTeam(data);

        if (Array.isArray(data.stats) && data.stats.length > 0) {
            setSelectedSeason(data.stats[0].season);
        }
      } 
      catch (err) {
        if (err) {
          navigate("/", { replace: true });
        } 
      }
    };
  loadTeam();
  }, [id, navigate]);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/teams/is-favorite/${id}`, {
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
        await favoriteTeam(id);
        setIsFavorited(true);
      }
      else{
        await removeFavoriteTeam(id);
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


  if (!team) return <p>Loading...</p>;

  const currentStats = team.stats.find(s => s.season === selectedSeason);

  const logoUrl = `https://cdn.nba.com/logos/nba/${id}/primary/L/logo.svg`;
  return (
    <div>
      <NavBar />

      <div className="team-profile-picture">
        <img src={logoUrl} alt={team.name} className="team-profile-image" />
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

      <div style={{ padding: "1rem"}}>
        <div className="team-info-div">
            <h1 className="player-profile-first-name">{team.name}</h1>
        </div>
        <div
            className={`team-favorite-status ${isFavorited ? "favorited" : ""}`}
            onClick={handleFavoriteClick}
          >
            <img className="favorite-star" src={FavoriteStar} />
            <h2 className="favorited-text">
              {isFavorited ? "Favorited" : "Favorite"}
            </h2>
        </div>

        <div className="teams-record-div">
            <h1 className="records-text">
                <span className="wins-text">{currentStats.wins}</span>
                {" - "}
                <span className="losses-text">{currentStats.losses}</span>
            </h1>
        </div>


        <div className="team-stats-box">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="team-season-select"
            >
              {team.stats.map((s) => (
                <option key={s.season} value={s.season}>
                  {s.season}
                </option>
              ))}
            </select>
            {currentStats && (
            <div className="team-stats-grid">
                <Stat label="PTS" value={currentStats.points} />
                <Stat label="TRB" value={currentStats.rebounds} />
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


        <div className="roster-box">
            <h1 className="roster-text">ROSTER</h1>

            <div className="roster-grid">
                {roster.map(player => (
                <PlayerCard
                    key={player.id}
                    player={{
                    id: player.id,
                    name: player.full_name,
                    team: team.name
                    }}
                />
                ))}
            </div>
        </div>



      </div>
    </div>
  );
}
