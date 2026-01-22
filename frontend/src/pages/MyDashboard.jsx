import './MyDashboard.css';
import NavBar from '../components/NavBar';
import { useEffect, useState } from "react";
import DashboardPost from "../components/DashboardPost";
import { Link } from 'react-router-dom';
import DefaultImage from '../assets/default-pfp.png';
import { useNavigate } from 'react-router-dom';

export default function MyDashboard(){
    const [username, setUsername] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [favoritePlayers, setFavoritePlayers] = useState([]);
    const [favoriteTeams, setFavoriteTeams] = useState([]);
    const [followerCount, setFollowerCount] = useState();
    const [followingCount, setFollowingCount] = useState();
    const [likesCount, setLikesCount] = useState();
    const [myPosts, setMyPosts] = useState([]);

    useEffect(() => {
        const fetchMyPosts = async () => {
            try {
                const res = await fetch("http://localhost:5000/posts/me", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to fetch posts");
                setMyPosts(data);
            } catch (err) {
                console.error("Failed to fetch posts", err);
            }
        };

        fetchMyPosts();
    }, []);


    const navigate = useNavigate();

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("http://localhost:5000/api/upload-profile-picture", {
            method: "POST",
            headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setProfileImage(data.profile_image_url);
    };

    useEffect(() => {
    const fetchUserStats = async () => {
        try {
        const res = await fetch(
            "http://localhost:5000/api/users/me/stats",
            {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setFollowerCount(data.followers);
        setFollowingCount(data.following);
        setLikesCount(data.total_likes);
        } catch (err) {
        console.error("Failed to load user stats", err);
        }
    };

    fetchUserStats();
    }, []);


    useEffect(() => {
        const fetchFavorites = async () => {
            try {
            const res = await fetch("http://localhost:5000/api/get-user-favorites", {
                headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
                }
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
    }, []);


    useEffect(() => {
    const fetchUser = async () => {
        try {
        const res = await fetch("http://localhost:5000/api/get-current-user", {
            headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setUsername(data.username);
        setProfileImage(data.profile_image_url || "");
        } 
        
        catch (err) {
            console.error("Failed to load user", err);
        }
    };

    fetchUser();
    }, []);



    return (
        <div className="dashboard-div">
            <NavBar />
            <div className="profile-dashboard-div">
                <div className="avatar-info">
                    <img
                        src={profileImage || DefaultImage}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <h1 className="avatar-username">{username}</h1>
                    <div className="avatar-buttons">
                        <button className="follow-button">Follow</button>
                        <button className="request-button">Group Request</button>
                    </div>
                    <div className="counts-div">
                        <h3 className="followers-count">{followerCount}<br></br>followers</h3>
                        <h3 className="following-count">{followingCount}<br></br>following</h3>
                        <h3 className="likes-count">{likesCount}<br></br>likes</h3>
                    </div>
                </div>
                <div className="avatar-favorites">
                    <div className="favorite-players-div">
                        <h1 className="favorite-players-heading">Favorite Players</h1>
                        <div className="favorites-row">
                        {favoritePlayers.map(player => {
                        const imageUrl = `https://cdn.nba.com/headshots/nba/latest/260x190/${player.id}.png`;
                        return (
                            <div
                            key={player.id}
                            className="favorite-circle"
                            onClick={() => navigate(`/players-search/${player.id}`)}
                            title={player.name}
                            >
                            <img
                                src={imageUrl}
                                alt={player.name}
                                onError={(e) => {
                                e.target.src = DefaultImage;
                                }}
                            />
                            </div>
                        );
                        })}
                        </div>
                    </div>
                    <div className="favorite-teams-div">
                        <h1 className="favorite-teams-heading">Favorite Teams</h1>
                        <div className="team-favorites-row">
                            {favoriteTeams.map(team => {
                        const logoUrl = `https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`;
                        return (
                            <div
                            key={team.id}
                            className="team-favorite-circle"
                            onClick={() => navigate(`/teams-search/${team.id}`)}
                            title={team.name}
                            >
                            <img
                                src={logoUrl}
                                alt={team.name}
                                onError={(e) => {
                                e.target.src = DefaultImage;
                                }}
                            />
                            </div>
                        );
                        })}
                        </div>
                    </div>
                    <div className="groups-div">
                        <h1 className="groups-heading">Groups</h1>

                    </div>
                </div>
            </div>
            

            <div className="posts-dashboard-div">
                <div className="posts-navbar">
                    <h1 className="posts-heading">Posts</h1>
                    <Link to="/create-post">
                        <button className="create-post-button">Create a post</button>
                    </Link>
                </div>
                <div className="posts-grid">
                    {myPosts.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#9ca3af" }}>You have no posts yet.</p>
                    ) : (
                        myPosts.map((post) => <DashboardPost key={post.id} post={post} />)
                    )}
                </div>
            </div>


        </div>
    )
}