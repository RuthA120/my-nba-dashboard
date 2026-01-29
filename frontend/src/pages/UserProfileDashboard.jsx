import './MyDashboard.css';
import NavBar from '../components/NavBar';
import { useEffect, useState } from "react";
import DashboardPost from "../components/DashboardPost";
import { useNavigate, useParams } from 'react-router-dom';
import DefaultImage from '../assets/default-pfp.png';

export default function UserProfileDashboard() {
    const { id } = useParams(); 
    const userId = parseInt(id);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [username, setUsername] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [favoritePlayers, setFavoritePlayers] = useState([]);
    const [favoriteTeams, setFavoriteTeams] = useState([]);
    const [followerCount, setFollowerCount] = useState();
    const [followingCount, setFollowingCount] = useState();
    const [likesCount, setLikesCount] = useState();
    const [userPosts, setUserPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setUsername(data.username);
                setProfileImage(data.profile_image_url || "");
            } catch (err) {
                console.error("Failed to load user", err);
            }
        };
        fetchUser();
    }, [userId, token]);

    // Fetch user stats
    const fetchUserStats = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFollowerCount(data.followers);
            setFollowingCount(data.following);
            setLikesCount(data.total_likes);
        } catch (err) {
            console.error("Failed to load user stats", err);
        }
    };

    useEffect(() => {
        fetchUserStats();
    }, [userId, token]);

    // Fetch favorites
    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/users/${userId}/favorites`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setFavoritePlayers(data.players);
                setFavoriteTeams(data.teams);
            } catch (err) {
                console.error("Failed to load favorites", err);
            }
        };
        fetchFavorites();
    }, [userId, token]);

    // Fetch user posts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch(`http://localhost:5000/posts/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setUserPosts(data);
            } catch (err) {
                console.error("Failed to fetch posts", err);
            }
        };
        fetchPosts();
    }, [userId, token]);

    // Check if current user is already following
    useEffect(() => {
        const checkFollowing = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/users/${userId}/is-following`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setIsFollowing(data.isFollowing);
            } catch (err) {
                console.error("Failed to check following status", err);
            }
        };
        if (userId) checkFollowing();
    }, [userId, token]);

    // Toggle follow/unfollow
    const handleFollowToggle = async () => {
        try {
            const endpoint = isFollowing
                ? `http://localhost:5000/api/users/${userId}/unfollow`
                : `http://localhost:5000/api/users/${userId}/follow`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setIsFollowing(!isFollowing);
            fetchUserStats();
        } catch (err) {
            console.error("Failed to toggle follow", err);
        }
    };

    return (
        <div className="dashboard-div">
            <NavBar />
            <div className="profile-dashboard-div">
                <div className="avatar-info">
                    <img src={profileImage || DefaultImage} alt="Profile" className="profile-avatar" />
                    <h1 className="avatar-username">{username}</h1>
                    <div className="avatar-buttons">
                        <button className="follow-button" onClick={handleFollowToggle}>
                            {isFollowing ? "Unfollow" : "Follow"}
                        </button>
                        <button className="request-button">Group Request</button>
                    </div>
                    <div className="counts-div">
                        <h3 className="followers-count">{followerCount}<br />followers</h3>
                        <h3 className="following-count">{followingCount}<br />following</h3>
                        <h3 className="likes-count">{likesCount}<br />likes</h3>
                    </div>
                </div>

                <div className="avatar-favorites">
                    <div className="favorite-players-div">
                        <h1 className="favorite-players-heading">Favorite Players</h1>
                        <div className="favorites-row">
                            {favoritePlayers.map(player => (
                                <div
                                    key={player.id}
                                    className="favorite-circle"
                                    onClick={() => navigate(`/players-search/${player.id}`)}
                                    title={player.name}
                                >
                                    <img
                                        src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.id}.png`}
                                        alt={player.name}
                                        onError={(e) => { e.target.src = DefaultImage; }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="favorite-teams-div">
                        <h1 className="favorite-teams-heading">Favorite Teams</h1>
                        <div className="team-favorites-row">
                            {favoriteTeams.map(team => (
                                <div
                                    key={team.id}
                                    className="team-favorite-circle"
                                    onClick={() => navigate(`/teams-search/${team.id}`)}
                                    title={team.name}
                                >
                                    <img
                                        src={`https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`}
                                        alt={team.name}
                                        onError={(e) => { e.target.src = DefaultImage; }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="groups-div">
                        <h1 className="groups-heading">Groups</h1>
                    </div>
                </div>
            </div>

            <div className="posts-dashboard-div">
                <h1 className="posts-heading">Posts</h1>
                <div className="posts-grid">
                    {userPosts.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#9ca3af" }}>No posts yet.</p>
                    ) : (
                        userPosts.map(post => <DashboardPost key={post.id} post={post} />)
                    )}
                </div>
            </div>
        </div>
    )
}
