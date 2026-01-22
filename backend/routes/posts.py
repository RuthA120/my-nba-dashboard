from flask import Blueprint, request, jsonify
from database import get_db_connection
from functools import wraps
import cloudinary.uploader
import jwt
import os
from dotenv import load_dotenv

SECRET_KEY = os.getenv("SECRET_KEY")

posts_bp = Blueprint("posts", __name__)


from functools import wraps

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = decoded["user_id"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated


@posts_bp.route("", methods=["POST"])
@token_required
def create_post():
    title = request.form.get("title")
    content = request.form.get("content")
    image = request.files.get("image")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    image_url = None
    has_image = False

    if image:
        upload_result = cloudinary.uploader.upload(
            image,
            folder="nba_posts",
            resource_type="image"
        )
        image_url = upload_result["secure_url"]
        has_image = True

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO posts (user_id, title, content, has_image, image_url)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, created_at;
    """, (
        request.user_id,
        title,
        content,
        has_image,
        image_url
    ))

    post_id, created_at = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "id": post_id,
        "title": title,
        "content": content,
        "image_url": image_url,
        "created_at": created_at
    }), 201


@posts_bp.route("/<int:post_id>", methods=["GET"])
def get_post(post_id):
    conn = get_db_connection()
    cur = conn.cursor()

    # Get post info
    cur.execute("""
        SELECT
            p.id, p.title, p.content, p.image_url, p.created_at, p.user_id,
            u.username, u.profile_image_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = %s
    """, (post_id,))
    post = cur.fetchone()
    if not post:
        cur.close()
        conn.close()
        return jsonify({"error": "Post not found"}), 404

    # Get likes
    cur.execute("SELECT user_id FROM post_likes WHERE post_id = %s", (post_id,))
    likes = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()

    return jsonify({
        "id": post[0],
        "title": post[1],
        "content": post[2],
        "image_url": post[3],
        "created_at": post[4],
        "user_id": post[5],
        "username": post[6],
        "profile_image_url": post[7],
        "likes": likes
    })


# Like a post
@posts_bp.route("/<int:post_id>/like", methods=["POST"])
@token_required
def like_post(post_id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO post_likes (user_id, post_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (request.user_id, post_id))
        conn.commit()
    finally:
        cur.close()
        conn.close()
    return jsonify({"message": "Post liked"}), 200

# Unlike a post
@posts_bp.route("/<int:post_id>/like", methods=["DELETE"])
@token_required
def unlike_post(post_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM post_likes WHERE user_id = %s AND post_id = %s", (request.user_id, post_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Post unliked"}), 200

@posts_bp.route("/<int:post_id>", methods=["DELETE"])
@token_required
def delete_post(post_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check ownership
    cur.execute("SELECT user_id, image_url FROM posts WHERE id = %s", (post_id,))
    post = cur.fetchone()
    if not post:
        cur.close()
        conn.close()
        return jsonify({"error": "Post not found"}), 404
    
    if post[0] != request.user_id:
        cur.close()
        conn.close()
        return jsonify({"error": "Not authorized"}), 403

    # Delete likes first
    cur.execute("DELETE FROM post_likes WHERE post_id = %s", (post_id,))
    # Delete comments (optional)
    cur.execute("DELETE FROM comments WHERE post_id = %s", (post_id,))
    # Then delete the post
    cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
    
    conn.commit()
    cur.close()
    conn.close()

    # Optional: delete image from Cloudinary
    if post[1]:
        cloudinary.uploader.destroy(post[1].split("/")[-1].split(".")[0], folder="nba_posts")

    return jsonify({"message": "Post deleted"}), 200

@posts_bp.route("/all-posts", methods=["GET"])
@token_required
def get_all_posts():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            p.id,
            p.title,
            p.content,
            p.image_url,
            p.created_at,
            u.username,
            u.profile_image_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC;
    """, ())

    posts = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "id": p[0],
            "title": p[1],
            "content": p[2],
            "image_url": p[3],
            "created_at": p[4],
            "username": p[5],
            "profile_image_url": p[6]
        }
        for p in posts
    ])

@posts_bp.route("/following-posts", methods=["GET"])
@token_required
def get_following_posts():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            p.id,
            p.title,
            p.content,
            p.image_url,
            p.created_at,
            u.username,
            u.profile_image_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN user_friends uf ON uf.following_id = p.user_id
        WHERE uf.user_id = %s
        ORDER BY p.created_at DESC;
    """, (request.user_id, ))

    posts = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "id": p[0],
            "title": p[1],
            "content": p[2],
            "image_url": p[3],
            "created_at": p[4],
            "username": p[5],
            "profile_image_url": p[6]
        }
        for p in posts
    ])




@posts_bp.route("/me", methods=["GET"])
@token_required
def get_my_posts():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT
            p.id,
            p.title,
            p.content,
            p.image_url,
            p.created_at,
            u.username,
            u.profile_image_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = %s
        ORDER BY p.created_at DESC;
    """, (request.user_id,))
    
    posts = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "id": p[0],
            "title": p[1],
            "content": p[2],
            "image_url": p[3],
            "created_at": p[4],
            "username": p[5],
            "profile_image_url": p[6]
        }
        for p in posts
    ])

# Get comments for a post
@posts_bp.route("/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id, c.content, c.created_at, c.user_id, u.username, u.profile_image_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = %s
        ORDER BY c.created_at DESC
    """, (post_id,))
    comments = [
        {
            "id": row[0],
            "content": row[1],
            "created_at": row[2],
            "user_id": row[3],
            "username": row[4],
            "profile_image_url": row[5]
        } for row in cur.fetchall()
    ]
    cur.close()
    conn.close()
    return jsonify(comments)

# Add a comment to a post
@posts_bp.route("/<int:post_id>/comments", methods=["POST"])
@token_required
def add_comment(post_id):
    data = request.get_json()
    content = data.get("content")
    if not content:
        return jsonify({"error": "Content required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Insert comment
    cur.execute("""
        INSERT INTO comments (post_id, user_id, content)
        VALUES (%s, %s, %s)
        RETURNING id, created_at
    """, (post_id, request.user_id, content))
    comment_id, created_at = cur.fetchone()

    # Fetch username and profile_image_url
    cur.execute("SELECT username, profile_image_url FROM users WHERE id = %s", (request.user_id,))
    user = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "id": comment_id,
        "content": content,
        "created_at": created_at,
        "user_id": request.user_id,
        "username": user[0],
        "profile_image_url": user[1]
    }), 201

