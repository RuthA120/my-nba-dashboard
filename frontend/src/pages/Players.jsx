import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlayers } from "../api/players";
import PlayerCard from "../components/PlayerCard";
import SearchBar from "../components/SearchBar";
import NavBar from "../components/NavBar";
import { useNavigate } from 'react-router-dom';
import './Players.css';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 21;
  const navigate = useNavigate();

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await fetchPlayers();
        setPlayers(data);
      } catch (err) {
        if (err.status === 401) {
          navigate("/", { replace: true });
        } else {
          console.error(err);
        }
      }
    };

    loadPlayers();
  }, [navigate]);


  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const indexOfLast = currentPage * playersPerPage;
  const indexOfFirst = indexOfLast - playersPerPage;
  const currentPlayers = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / playersPerPage);

  return (
    <div>
      <NavBar />

      <div style={{ paddingTop: "7rem", paddingLeft: "5rem", paddingRight: "4rem", paddingBottom: "5rem" }}>
        <SearchBar query={query} setQuery={setQuery} />
      </div>

      <div className="players-box" style={{ paddingBottom: "3rem" }}>
        <Link to={`/players-search`}>
            <div className="players-tab">
                PLAYER SEARCH
            </div>
        </Link>
        <Link to={`/teams-search`}>
            <div className="teams-tab">
                TEAM SEARCH
            </div>
        </Link>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          rowGap: "0.5rem",
          columnGap: "0.5rem",
          padding: "2rem 5rem"
        }}>
          {currentPlayers.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "5rem" }}>
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span style={{ margin: "0 1rem" }}>{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
