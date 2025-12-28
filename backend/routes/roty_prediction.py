from flask import Blueprint, jsonify
from database import get_db_connection
import jwt
from datetime import datetime, timedelta
from flask import jsonify, request
from werkzeug.security import check_password_hash

roty_bp = Blueprint("roty", __name__)
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

@roty_bp.route("/roty-model", methods=["GET"])
@token_required
def get_current_rookies():
    conn = get_db_connection()
    cur = conn.cursor()

    query = """
        SELECT
            p.id,
            p.full_name,
            p.team_name,
            p.draft_pick,
            s.points,
            s.minutes_per_game,
            s.field_goal_pct,
            s.rebounds,
            s.assists,
            s.steals,
            s.blocks,
            s.turnovers
        FROM players p
        JOIN player_stats s
            ON p.id = s.player_id
        WHERE p.draft_year = 2025
        AND s.season = '2025-26'
        AND s.points >= 5
        AND s.minutes_per_game >= 15
        AND s.field_goal_pct >= 0.35
        AND s.rebounds >= 2
        AND p.draft_pick <= 60;
    """

    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    rookies = [
        {
            "id": r[0],
            "full_name": r[1],
            "team_name": r[2],
            "Pick Number": r[3],
            "PTS": r[4],
            "MP": r[5],
            "FG%": r[6],
            "TRB": r[7],
            "AST": r[8],
            "STL": r[9],
            "BLK": r[10],
            "TOV": r[11]
        }
        for r in rows
    ]

    import joblib
    # Load the scaler and the trained Random Forest model
    scaler = joblib.load("./model-files/scaler.pkl")
    calibrated_model = joblib.load("./model-files/roty_model.pkl")  # if you calibrated

    import pandas as pd
    features = ['MP', 'PTS', 'TRB', 'AST', 'STL', 'BLK', 'Pick Number']
    rookies_df = pd.DataFrame(rookies)  # rookies is the list of dicts from SQL
    print(rookies_df.columns)
    X_rookies = rookies_df[features]    # features = columns you used in training
    X_scaled = scaler.transform(X_rookies)

    probs = calibrated_model.predict_proba(X_scaled)[:, 1]  # probability of winning
    probs_normalized = probs / probs.sum()
    rookies_df["roty_prob"] = probs_normalized

    top5 = rookies_df.sort_values("roty_prob", ascending=False).head(5)

    return jsonify(top5.to_dict(orient="records"))

