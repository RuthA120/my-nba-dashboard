import React from "react";
import DefaultImage from "../assets/default-pfp.png";
import "./DashboardPost.css";
import { useNavigate } from "react-router-dom";

export default function DashboardPost({ post }) {
  const postClass = post.image_url ? "dashboard-post" : "dashboard-post no-image";
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/posts/${post.id}`);
  };

  return (
    <div className={postClass} onClick={handleClick}>
      <div className="post-header-strip">
          <img
                src={post.profile_image_url || DefaultImage}
                alt="Profile"
                className="post-avatar"
            />
            <span className="post-username">@{post.username}</span>
        </div>
      <h2 className="post-title">{post.title}</h2>
      <p className="post-content">{post.content}</p>
      {post.image_url && (
        <img src={post.image_url} alt="Post" className="post-image" />
      )}
      <p className="post-date">{new Date(post.created_at).toLocaleString()}</p>
    </div>
  );
}
