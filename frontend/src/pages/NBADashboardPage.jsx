import { useState, useEffect } from 'react';
import './NBADashboardPage.css';
import DashboardPost from "../components/NBADashboardPost";
import bballIMG from '../assets/b-ball.png';
import AnalyticsIcon from '../assets/Analytics-Icon.png';
import GroupsIcon from '../assets/Groups-Icon.png';
import Loader from '../components/Loader';
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
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const loading = currentFeed === "explore" ? loadingAll : loadingFollowing;


  useEffect(() => {
    const fetchAllPosts = async () => {
      setLoadingAll(true);
      try {
        const res = await fetch("http://localhost:5000/posts/all-posts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAllPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAll(false);
      }
    };

    fetchAllPosts();
  }, []);


  useEffect(() => {
    const fetchFollowingPosts = async () => {
      setLoadingFollowing(true);
      try {
        const res = await fetch("http://localhost:5000/posts/following-posts", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFollowingPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFollowing(false);
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
              <span onClick={() => navigate("/similarity-engine")}>Player Similarity Engine</span>
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
          {loading ? (
            <Loader />
          ) : filteredPosts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            filteredPosts.map(post => (
              <DashboardPost key={post.id} post={post} />
            ))
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
              Discover how players compare in playing style with the NBA Player Similarity Engine!
            </li>
            <li className="update-item">
              Explore the ROTY Predictor model to see which rookies are leading the race for the ROTY title!
            </li>
            <li className="update-item">
              Favorite specific players and teams, and have them displayed on your dashboard for others to see!
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
