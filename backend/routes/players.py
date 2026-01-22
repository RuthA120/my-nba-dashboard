from flask import Blueprint, jsonify
from database import get_db_connection
import jwt
from datetime import datetime, timedelta
from flask import jsonify, request
from werkzeug.security import check_password_hash

from functools import wraps
import os
from dotenv import load_dotenv

SECRET_KEY = os.getenv("SECRET_KEY")

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



players_bp = Blueprint("players", __name__)

@players_bp.route("/", methods=["GET"])
@token_required
def get_players():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, full_name, team_name, is_active
        FROM players
        ORDER BY full_name;
    """)

    players = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "id": p[0],
            "name": p[1],
            "team": p[2],
            "active": p[3]
        }
        for p in players
    ])

@players_bp.route("/<int:player_id>", methods=["GET"])
@token_required
def get_player(player_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            p.id, p.first_name, p.last_name, p.team_name, p.is_active,
            ps.season, ps.points, ps.rebounds, ps.assists, ps.steals,
            ps.blocks, ps.turnovers, ps.field_goal_pct, ps.three_point_pct,
            ps.free_throw_pct, ps.team_name
        FROM players p
        LEFT JOIN player_stats ps
        ON p.id = ps.player_id
        WHERE p.id = %s
        ORDER BY ps.season DESC;
    """, (player_id,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return jsonify({"error": "Player not found"}), 404

    return jsonify({
        "id": rows[0][0],
        "first_name": rows[0][1],
        "last_name": rows[0][2],
        "team": rows[0][3],
        "active": rows[0][4],
        "stats": [
            {
                "season": r[5],
                "points": r[6],
                "rebounds": r[7],
                "assists": r[8],
                "steals": r[9],
                "blocks": r[10],
                "turnovers": r[11],
                "field_goal_pct": r[12],
                "three_point_pct": r[13],
                "free_throw_pct": r[14],
                "team_name": r[15]
            }
            for r in rows if r[4]
        ]
    })

@players_bp.route("/is-favorite/<int:player_id>", methods=["GET"])
@token_required
def is_favorite_player(player_id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT 1 FROM user_favorites
            WHERE user_id = %s AND entity_id = %s AND entity_type = 'player'
            """,
            (request.user_id, player_id)
        )
        favorited = cur.fetchone() is not None
    finally:
        cur.close()
        conn.close()

    return jsonify({"isFavorited": favorited}), 200


@players_bp.route("/favorite-player", methods=["POST"])
@token_required
def set_favorite_player():
    player_id = request.json.get("playerId")  # or request.form.get("playerId")
    if not player_id:
        return jsonify({"error": "Missing playerId"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO user_favorites (user_id, entity_type, entity_id)
            VALUES (%s, 'player', %s)
            ON CONFLICT DO NOTHING
            """,
            (request.user_id, player_id)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

    return jsonify({"message": "Player favorited"}), 200


@players_bp.route("/remove-favorite-player", methods=["DELETE"])
@token_required
def remove_favorite_player():
    player_id = request.json.get("playerId")  
    if not player_id:
        return jsonify({"error": "Missing playerId"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            DELETE FROM user_favorites 
            WHERE user_id = %s 
            AND entity_id = %s
            """,
            (request.user_id, player_id)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

    return jsonify({"message": "Player unfavorited"}), 200

