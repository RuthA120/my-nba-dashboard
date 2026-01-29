from flask import Blueprint, request, jsonify
from database import get_db_connection
import psycopg2
from psycopg2 import errors
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from flask import jsonify, request
from werkzeug.security import check_password_hash
import os
from dotenv import load_dotenv

SECRET_KEY = os.getenv("SECRET_KEY")
current_user_bp = Blueprint("current_user", __name__)


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


@current_user_bp.route("/get-current-user", methods=["GET"])
@token_required
def get_current_user():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, username, profile_image_url FROM users WHERE id = %s",
        (request.user_id,)
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user[0],  # add this
        "username": user[1],
        "profile_image_url": user[2]
    }), 200



@current_user_bp.route("/get-user-favorites", methods=["GET"])
@token_required
def get_favorites():
    conn = get_db_connection()
    cur = conn.cursor()

    # Favorite players
    cur.execute("""
        SELECT p.id, p.full_name
        FROM user_favorites uf
        JOIN players p ON uf.entity_id = p.id
        WHERE uf.user_id = %s
        and entity_type = 'player'
    """, (request.user_id,))
    players = cur.fetchall()

    # Favorite teams
    cur.execute("""
        SELECT t.id, t.full_name
        FROM user_favorites uf
        JOIN teams t ON uf.entity_id = t.id
        WHERE uf.user_id = %s
        and entity_type = 'team'
    """, (request.user_id,))
    teams = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify({
        "players": [
            {"id": p[0], "name": p[1]}
            for p in players
        ],
        "teams": [
            {"id": t[0], "name": t[1]}
            for t in teams
        ]
    }), 200

# Get current user's stats (fixed)
@current_user_bp.route("/users/me/stats", methods=["GET"])
@token_required
def get_user_stats():
    conn = get_db_connection()
    cur = conn.cursor()

    # Followers count
    cur.execute("""
        SELECT COUNT(*)
        FROM user_friends
        WHERE following_id = %s;
    """, (request.user_id,))
    followers_count = cur.fetchone()[0]

    # Following count
    cur.execute("""
        SELECT COUNT(*)
        FROM user_friends
        WHERE user_id = %s;
    """, (request.user_id,))
    following_count = cur.fetchone()[0]

    # Total likes on user's posts
    cur.execute("""
        SELECT COUNT(*)
        FROM post_likes pl
        JOIN posts p ON pl.post_id = p.id
        WHERE p.user_id = %s;
    """, (request.user_id,))
    total_likes = cur.fetchone()[0]

    cur.close()
    conn.close()

    return jsonify({
        "followers": followers_count,
        "following": following_count,
        "total_likes": total_likes
    }), 200


@current_user_bp.route("/users/<int:user_id>/follow", methods=["POST"])
@token_required
def follow_user(user_id):
    if user_id == request.user_id:
        return jsonify({"error": "Cannot follow yourself"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO user_friends (user_id, following_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (request.user_id, user_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

    cur.close()
    conn.close()
    return jsonify({"message": f"Now following user {user_id}"}), 200


@current_user_bp.route("/users/<int:user_id>/unfollow", methods=["POST"])
@token_required
def unfollow_user(user_id):
    if user_id == request.user_id:
        return jsonify({"error": "Cannot unfollow yourself"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM user_friends
        WHERE user_id = %s AND following_id = %s
    """, (request.user_id, user_id))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": f"Unfollowed user {user_id}"}), 200


@current_user_bp.route("/users/me/following", methods=["GET"])
@token_required
def get_following():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.username, u.profile_image_url
        FROM user_friends uf
        JOIN users u ON uf.following_id = u.id
        WHERE uf.user_id = %s
    """, (request.user_id,))
    following = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {"id": u[0], "username": u[1], "profile_image_url": u[2]}
        for u in following
    ]), 200


@current_user_bp.route("/users/me/followers", methods=["GET"])
@token_required
def get_followers():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.username, u.profile_image_url
        FROM user_friends uf
        JOIN users u ON uf.user_id = u.id
        WHERE uf.following_id = %s
    """, (request.user_id,))
    followers = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {"id": u[0], "username": u[1], "profile_image_url": u[2]}
        for u in followers
    ]), 200
