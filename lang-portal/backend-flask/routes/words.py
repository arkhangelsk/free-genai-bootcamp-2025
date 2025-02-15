from flask import Blueprint, jsonify, request
from db.lib.db import get_db

words_bp = Blueprint("words", __name__)

@words_bp.route("/words", methods=["GET"])
def get_all_words():
    db = get_db()
    words = db.execute("SELECT * FROM words").fetchall()
    db.close()
    return jsonify([dict(word) for word in words])


@words_bp.route("/words/<int:word_id>", methods=["GET"])
def get_word(word_id):
    db = get_db()
    word = db.execute("SELECT * FROM words WHERE id = ?", (word_id,)).fetchone()
    db.close()
    return jsonify(dict(word)) if word else ("Not Found", 404)
