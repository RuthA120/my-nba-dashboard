import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DefaultImage from "../assets/default-pfp.png";
import "./PostDetail.css";
import NavBar from "../components/NavBar";

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        const [postRes, commentsRes, userRes] = await Promise.all([
          fetch(`http://localhost:5000/posts/${postId}`),
          fetch(`http://localhost:5000/posts/${postId}/comments`),
          token
            ? fetch("http://localhost:5000/api/get-current-user", {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
        ]);

        const postData = await postRes.json();
        const commentsData = await commentsRes.json();

        setPost(postData);
        setComments(commentsData);

        if (token && userRes) {
          const userData = await userRes.json();
          setCurrentUserId(userData.id);

          // Disable like button if user has already liked
          if (postData.likes.includes(userData.id)) setLiked(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [postId]);

  const handleLike = async () => {
    if (!localStorage.getItem("token")) return alert("Login to like posts");

    try {
      if (liked) {
        // Unlike
        await fetch(`http://localhost:5000/posts/${postId}/like`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setPost({
          ...post,
          likes: post.likes.filter((id) => id !== currentUserId),
        });
        setLiked(false);
      } else {
        // Like
        await fetch(`http://localhost:5000/posts/${postId}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setPost({ ...post, likes: [...post.likes, currentUserId] });
        setLiked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`http://localhost:5000/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      navigate("/my-dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      });

      const comment = await res.json();
      setComments([comment, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUsernameClick = () => {
    if (currentUserId === post.user_id) {
      navigate("/my-dashboard");
    } else {
      navigate(`/user-profile/${post.user_id}`);
    }
  };

  if (!post) return <p>Loading...</p>;

  return (
    <div>
      <NavBar />
      <div className="post-detail">
        <div className="post-detail-header-strip">
          <img
            src={post.profile_image_url || DefaultImage}
            alt="Profile"
            className="post-detail-avatar"
          />
          <span
            className="post-detail-username"
            onClick={handleUsernameClick}
          >
            @{post.username}
          </span>
        </div>
        <h2 className="post-detail-title">{post.title}</h2>
        <p className="post-detail-content">{post.content}</p>
        {post.image_url && <img src={post.image_url} alt="Post" className="post-detail-image" />}
        <div className="post-detail-bottom">
        <p className="post-detail-date">{new Date(post.created_at).toLocaleString()}</p>
        <div className="post-actions">
          <button
            onClick={handleLike}
            className={`like-button ${liked ? "liked" : ""}`}
          >
            {liked ? "Liked" : "Like"} ({post.likes.length})
          </button>
          {currentUserId === post.user_id && (
            <button onClick={handleDelete} className="delete-button">
              Delete
            </button>
          )}
        </div>
      </div>

        <div className="comments-section">
          <h3>Comments</h3>
          <div className="add-comment">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment}>Post</button>
          </div>

          <div className="comments-list">
            {comments.map((c) => (
              <div key={c.id} className="comment">
                <img src={c.profile_image_url || DefaultImage} alt="Profile" />
                <div>
                  <strong>@{c.username}</strong>
                  <p>{c.content}</p>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {comments.length === 0 && <p>No comments yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
