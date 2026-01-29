import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DefaultImage from '../assets/default-pfp.png';
import "./CreatePost.css";
import NavBar from "../components/NavBar";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/get-current-user", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch("http://localhost:5000/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");

      
      setTitle(""); setContent(""); setImageFile(null); setImagePreview(null);
      navigate("/my-dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="create-post-page">
      <NavBar />
      <div className="create-post-card">
        {/* Gradient header strip */}
        <div className="create-post-header-strip">
          <img src={profileImage || DefaultImage} alt="Profile" className="create-post-avatar" />
          <span className="create-post-username">@{username}</span>
        </div>

        <form className="create-post-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="create-post-title"
          />

          <textarea
            placeholder="Share your NBA take..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="create-post-content"
          />

          <input type="file" accept="image/*" onChange={handleImageChange} className="create-post-file" />

          <div className="create-post-image-preview">
            {imagePreview ? <img src={imagePreview} alt="Preview" /> : <span>No image uploaded</span>}
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="create-post-submit">POST</button>
        </form>
      </div>
    </div>
  );
}
