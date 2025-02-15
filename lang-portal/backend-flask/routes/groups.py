from flask import Blueprint, jsonify, request
from db.lib.db import get_db

groups_bp = Blueprint("groups", __name__)

# GET /api/groups → List of all word groups
@groups_bp.route("/groups", methods=["GET"])
def get_all_groups():
    db = get_db()
    groups = db.execute("SELECT * FROM groups").fetchall()
    db.close()
    return jsonify([dict(group) for group in groups])

# GET /api/groups/<int:id> → Get a specific group by ID
@groups_bp.route("/groups/<int:id>", methods=["GET"])
def get_group(id):
    db = get_db()
    group = db.execute("SELECT * FROM groups WHERE id = ?", (id,)).fetchone()
    db.close()
    return jsonify(dict(group)) if group else ("Not Found", 404)

# GET /api/groups/<int:id>/words → Get all words belonging to a specific group
@groups_bp.route("/groups/<int:id>/words", methods=["GET"])
def get_group_words(id):
    db = get_db()
    words = db.execute("SELECT * FROM words WHERE group_id = ?", (id,)).fetchall()
    db.close()
    return jsonify([dict(word) for word in words])


@groups_bp.route("/groups/<int:id>/study_sessions", methods=["GET"])
def get_group_study_sessions(id):
    # Placeholder for session retrieval logic
    return jsonify({"message": f"Study sessions for group {id}"})
