import { useState, useEffect } from 'react';
import './NBADashboardPage.css';
import DashboardPost from "../components/NBADashboardPost";
import bballIMG from '../assets/b-ball.png';
import AnalyticsIcon from '../assets/Analytics-Icon.png';
import GroupsIcon from '../assets/Groups-Icon.png';
import MLIcon from '../assets/ML-Icon.png';
import ProfileIcon from '../assets/Profile-Icon.png';
import SearchIcon from '../assets/Side-search-icon.png';
import InfoIcon from '../assets/Info-Icon.png';
import { useNavigate } from 'react-router-dom';

export default function NBADashboardPage() {
  const [allPosts, setAllPosts] = useState([]);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [currentFeed, setCurrentFeed] = useState("explore");
  const [searchQuery, setSearchQuery] = useState(""); // search input
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const res = await fetch("http://localhost:5000/posts/all-posts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch posts");
        setAllPosts(data);
      } catch (err) {
        console.error("Failed to fetch all posts", err);
      }
    };
    fetchAllPosts();
  }, []);

  useEffect(() => {
    const fetchFollowingPosts = async () => {
      try {
        const res = await fetch("http://localhost:5000/posts/following-posts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch following posts");
        setFollowingPosts(data);
      } catch (err) {
        console.error("Failed to fetch following posts", err);
      }
    };
    fetchFollowingPosts();
  }, []);

  const postsToDisplay = currentFeed === "explore" ? allPosts : followingPosts;

  const filteredPosts = postsToDisplay.filter((post) => {
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.username.toLowerCase().includes(query)
    );
  });

  return (
    <div className="nba-dashboard-grid">

      <div className="side-dashboard-nav">
        <div className="top-section">
          <img src={bballIMG} alt="Basketball" className="bball-img" />
          <h1 className="side-dashboard-title" onClick={() => navigate('/nba-dashboard')}>
            NBA<br />Dashboard
          </h1>
        </div>
        <ul className="side-dashboard-menu">
          <li className="side-dashboard-item">
            <img src={InfoIcon} />
            About Us
          </li>

          <li className="side-dashboard-item has-submenu">
            <img src={SearchIcon} />
            Search

            <div className="sidebar-submenu">
              <span onClick={() => navigate("/players-search")}>Search Players</span>
              <span onClick={() => navigate("/teams-search")}>Search Teams</span>
            </div>
          </li>

          <li className="side-dashboard-item has-submenu">
            <img src={MLIcon} />
            ML Models

            <div className="sidebar-submenu">
              <span onClick={() => navigate("/roty-tracker")}>Live ROTY Predictor</span>
            </div>
          </li>

          <li className="side-dashboard-item has-submenu">
            <img src={AnalyticsIcon} />
            Analytics
            <div className="sidebar-submenu">
              <span onClick={() => navigate("/player-similarity")}>Player Similarity Engine</span>
            </div>
          </li>

          <li className="side-dashboard-item has-submenu">
            <img src={GroupsIcon} />
            Groups

            <div className="sidebar-submenu">
              <span>Coming Soon!</span>
            </div>
          </li>

          <li className="side-dashboard-item has-submenu">
            <img src={ProfileIcon} />
            Profile

            <div className="sidebar-submenu">
              <span onClick={() => navigate("/my-dashboard")}>View My Profile</span>
            </div>
          </li>
        </ul>

      </div>

      {/* Posts Feed */}
      <div className="dash-posts-feed">
        <div className="feed-buttons">
          <button
            className={currentFeed === "explore" ? "active-feed-button" : "explore-button"}
            onClick={() => setCurrentFeed("explore")}
          >
            Explore
          </button>
          <button
            className={currentFeed === "following" ? "active-feed-button" : "following-feed-button"}
            onClick={() => setCurrentFeed("following")}
          >
            Following
          </button>
        </div>

        <div className="main-posts-grid">
          {filteredPosts.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af" }}>
              No posts found.
            </p>
          ) : (
            filteredPosts.map((post) => <DashboardPost key={post.id} post={post} />)
          )}
        </div>
      </div>

      <div className="updates-search-div">
        <div className="updates-search-card">
          <input
            type="text"
            placeholder="Search posts by title, content, or user"
            className="updates-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="updates-panel">
          <h2 className="updates-title">Site Updates</h2>
          <ul className="updates-list">
            <li className="update-item">
              🚀 New feature launched! Explore player similarity scores and compare advanced stats across seasons.
            </li>
            <li className="update-item">
              🏀 MVP Predictor model improved using historical voting data and advanced metrics.
            </li>
            <li className="update-item">
              📊 Analytics dashboard redesigned for faster insights and cleaner navigation.
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
