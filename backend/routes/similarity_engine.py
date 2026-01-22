from flask import Blueprint, jsonify, request
from database import get_db_connection
from functools import wraps
import os
import numpy as np
from numpy.linalg import norm
import psycopg2
import jwt
from dotenv import load_dotenv

load_dotenv()

ml_engine = Blueprint("ml_engine", __name__)
SECRET_KEY = os.getenv("SECRET_KEY")


# --- Auth decorator ---
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


@ml_engine.route("/similarity-engine", methods=["GET"])
@token_required
def similarity_engine():
    player1_id = request.args.get("player1_id", type=int)
    player2_id = request.args.get("player2_id", type=int)

    if not player1_id or not player2_id:
        return jsonify({"error": "Both player IDs required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT player_id, embedding
        FROM player_embeddings
        WHERE player_id IN (%s, %s)
    """, (player1_id, player2_id))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if len(rows) != 2:
        return jsonify({"error": "Players not found"}), 404

    vec_a = np.array(rows[0][1])
    vec_b = np.array(rows[1][1])

    sim = np.dot(vec_a, vec_b) / (norm(vec_a) * norm(vec_b))
    sim_scaled = (sim + 1) / 2
    similarity_percentage = round(sim_scaled * 100, 2)

    return jsonify({
        "player_1_id": rows[0][0],
        "player_2_id": rows[1][0],
        "similarity_percent": similarity_percentage
    })

@ml_engine.route("/similarity-engine/load-players", methods=["GET"])
@token_required
def get_players():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT pe.player_id, p.full_name
        FROM player_embeddings as pe
        LEFT JOIN players as p
        ON p.id = pe.player_id
        ORDER BY full_name;
    """)

    players = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "id": p[0],
            "name": p[1]
        }
        for p in players
    ])

@ml_engine.route("/similarity-engine/get-player-stats", methods=["GET"])
@token_required
def get_player_stats():
    player1_id = request.args.get("player1_id", type=int)
    player2_id = request.args.get("player2_id", type=int)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT player_id, player_name, 
            points,
            rebounds,
            assists,
            steals,
            blocks,
            threes_attempted,
            paint_pts_attempted,
            mid_fg_attempted,
            usage_pct
        FROM player_adv_stats
        WHERE player_id IN (%s, %s)
    """, (player1_id, player2_id))

    players = cur.fetchall()
    cur.close()
    conn.close()

    player_stats = []
    for p in players:
        player_stats.append({
            "id": p[0],
            "name": p[1],
            "points": p[2],
            "rebounds": p[3],
            "assists": p[4],
            "steals": p[5],
            "blocks": p[6],
            "threes_attempted": p[7],
            "paint_pts_attempted": p[8],
            "mid_fg_attempted": p[9],
            "usage_pct": p[10]
        })

    return jsonify(player_stats)
