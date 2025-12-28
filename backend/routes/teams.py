from flask import Blueprint, jsonify
from database import get_db_connection
import jwt
from datetime import datetime, timedelta
from flask import jsonify, request
from werkzeug.security import check_password_hash

teams_bp = Blueprint("teams", __name__)
SECRET_KEY = "Lt2J]F6Go0£$"
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


@teams_bp.route("/<string:team_name>", methods=["GET"])
@token_required
def get_team(team_name):
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
        WHERE t.full_name = %s
        ORDER BY ts.season DESC;
    """, (team_name,))

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
