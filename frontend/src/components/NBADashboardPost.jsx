import React from "react";
import DefaultImage from "../assets/default-pfp.png";
import "./NBADashboardPost.css";
import { useNavigate } from "react-router-dom";

export default function NBADashboardPost({ post }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-post-card" onClick={() => navigate(`/posts/${post.id}`)}>
      
      <div className="post-header-strip">
        <img
          src={post.profile_image_url || DefaultImage}
          alt="Profile"
          className="post-avatar"
        />
        <span className="post-username">@{post.username}</span>
      </div>

      <div className="post-body">
        <h2 className="post-title">{post.title}</h2>
        <p className="post-content">{post.content}</p>

        {post.image_url && (
          <img src={post.image_url} alt="Post" className="main-post-image" />
        )}

        <p className="post-date">
          {new Date(post.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
