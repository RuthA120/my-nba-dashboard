from flask import Blueprint, jsonify
from database import get_db_connection
import jwt
from datetime import datetime, timedelta
from flask import jsonify, request
from werkzeug.security import check_password_hash
import os
from dotenv import load_dotenv

SECRET_KEY = os.getenv("SECRET_KEY")
teams_bp = Blueprint("teams", __name__)

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

@teams_bp.route("/", methods=["GET"])
@token_required
def get_teams():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, full_name
        FROM teams
        ORDER BY full_name;
    """)

    teams = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {"id": t[0], "name": t[1]}
        for t in teams
    ])


@teams_bp.route("/<int:team_id>", methods=["GET"])
@token_required
def get_team(team_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            t.id, t.full_name, t.abbreviation,
            ts.season, ts.wins, ts.losses, ts.points, ts.rebounds, ts.assists,
            ts.steals, ts.blocks, ts.turnovers, ts.field_goal_pct,
            ts.three_point_pct, ts.free_throw_pct
        FROM teams t
        LEFT JOIN team_stats ts
        ON t.full_name = ts.team_name
        WHERE t.id = %s
        ORDER BY ts.season DESC;
    """, (team_id,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return jsonify({"error": "Team not found"}), 404

    return jsonify({
        "id": rows[0][0],
        "name": rows[0][1],
        "abbrev": rows[0][2],
        "stats": [
            {
                "season": r[3],
                "wins": r[4],
                "losses": r[5],
                "points": r[6],
                "rebounds": r[7],
                "assists": r[8],
                "steals": r[9],
                "blocks": r[10],
                "turnovers": r[11],
                "field_goal_pct": r[12],
                "three_point_pct": r[13],
                "free_throw_pct": r[14]
            }
            for r in rows if r[3]
        ]
    })

@teams_bp.route("/is-favorite/<int:team_id>", methods=["GET"])
@token_required
def is_favorite_team(team_id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT 1 FROM user_favorites
            WHERE user_id = %s AND entity_id = %s AND entity_type = 'team'
            """,
            (request.user_id, team_id)
        )
        favorited = cur.fetchone() is not None
    finally:
        cur.close()
        conn.close()

    return jsonify({"isFavorited": favorited}), 200


@teams_bp.route("/favorite-team", methods=["POST"])
@token_required
def set_favorite_player():
    team_id = request.json.get("teamId")  # or request.form.get("playerId")
    if not team_id:
        return jsonify({"error": "Missing teamId"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO user_favorites (user_id, entity_type, entity_id)
            VALUES (%s, 'team', %s)
            ON CONFLICT DO NOTHING
            """,
            (request.user_id, team_id)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

    return jsonify({"message": "Team favorited"}), 200


@teams_bp.route("/remove-favorite-team", methods=["DELETE"])
@token_required
def remove_favorite_team():
    team_id = request.json.get("teamId")  
    if not team_id:
        return jsonify({"error": "Missing teamId"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            DELETE FROM user_favorites 
            WHERE user_id = %s 
            AND entity_id = %s
            """,
            (request.user_id, team_id)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

    return jsonify({"message": "Team unfavorited"}), 200


@teams_bp.route("/<int:team_id>/roster", methods=["GET"])
@token_required
def get_team_roster(team_id):
    season = request.args.get("season")

    if not season:
        return jsonify({"error": "Season is required"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT p.id, p.full_name
            FROM player_stats ps
            JOIN players p ON ps.player_id = p.id
            WHERE ps.team_id = %s
              AND ps.season = %s
              ORDER BY p.last_name ASC
            """,
            (team_id, season)
        )

        players = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify([
            {"id": p[0], "full_name": p[1]}
            for p in players
        ])

    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to fetch roster"}), 500
