from flask import Blueprint, jsonify, request
from db.lib.db import get_db

study_activities_bp = Blueprint("study_activities", __name__)

@study_activities_bp.route("/study-activities", methods=["GET"])
def get_all_study_activities():
    db = get_db()
    activities = db.execute("SELECT * FROM study_activities").fetchall()
    db.close()
    return jsonify([dict(activity) for activity in activities])


@study_activities_bp.route("/study-activities/<int:id>", methods=["GET"])
def get_study_activity(id):
    db = get_db()
    activity = db.execute(
        "SELECT * FROM study_activities WHERE id = ?", (id,)
    ).fetchone()
    db.close()
    return jsonify(dict(activity)) if activity else ("Not Found", 404)


@study_activities_bp.route("/study-activities/<int:id>/sessions", methods=["GET"])
def get_activity_sessions(id):
    # Placeholder for session retrieval logic
    return jsonify({"message": "Study sessions for activity " + str(id)})
