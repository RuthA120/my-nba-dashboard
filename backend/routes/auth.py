from flask import Blueprint, request, jsonify
from database import get_db_connection
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps

import os
from dotenv import load_dotenv

import cloudinary
import cloudinary.uploader


auth_bp = Blueprint("auth", __name__)
SECRET_KEY = os.getenv("SECRET_KEY")

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



@auth_bp.route("/username-creation", methods=["POST"])
@token_required
def set_username():
    data = request.json
    username = data.get("username")

    if not username:
        return jsonify({"error": "Missing data"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "UPDATE users SET username = %s WHERE id = %s",
            (username, request.user_id)
        )
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Username already taken"}), 400
    finally:
        cur.close()
        conn.close()

    return jsonify({"message": "Username set"}), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    if request.method == "OPTIONS":
        return '', 200
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
            (email, hashed_password)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 400
    except Exception as e:
        conn.rollback()
        print("Unexpected error:", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify({"message": "User registered successfully", "user_id": user_id}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash, username FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user or not check_password_hash(user[1], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = jwt.encode(
        {
            "user_id": user[0],
            "exp": datetime.utcnow() + timedelta(hours=24)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({
        "token": token,
        "has_username": user[2] is not None
    })


cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

def allowed_file(filename):
    return (
        "." in filename and
        filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


@auth_bp.route("/upload-profile-picture", methods=["POST"])
@token_required
def upload_profile_picture():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image = request.files["image"]

    if not allowed_file(image.filename):
        return jsonify({"error": "Invalid file type"}), 400

    try:
        upload_result = cloudinary.uploader.upload(
            image,
            folder="profile_pictures",
            public_id=f"user_{request.user_id}",
            overwrite=True
        )

        image_url = upload_result["secure_url"]

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET profile_image_url = %s WHERE id = %s",
            (image_url, request.user_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"profile_image_url": image_url}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Upload failed"}), 500


@auth_bp.route("/api/upload-post-image", methods=["POST"])
@token_required
def upload_post_image():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]

    try:
        upload_result = cloudinary.uploader.upload(
            file,
            folder="nba_dashboard/posts"
        )

        return jsonify({
            "image_url": upload_result["secure_url"]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
