import { useEffect, useRef, useState } from "react";
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
  const gridRef = useRef(null);
  const ROWS = 5;
  const [columns, setColumns] = useState(1);
  const playersPerPage = columns * ROWS;
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!gridRef.current) return;

    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      const cols = Math.floor(width / 220);
      setColumns(Math.max(cols, 1));
    });

    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await fetchPlayers();
        setPlayers(data);
      } catch (err) {
        if (err) {
          navigate("/");
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
        <div
          ref={gridRef}
          className="players-grid"
        >
          {currentPlayers.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>

        <div className="page-indicator">
            {currentPage} / {totalPages}
        </div>
        
        <div className="pagination">
          
          <div className="page-control-left">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
          </div>


          <div className="page-control-right">
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
