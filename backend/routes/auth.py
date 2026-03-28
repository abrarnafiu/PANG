import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from models import db, User

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def _validate_register(data):
    errors = []
    if not data.get("username") or len(data["username"].strip()) < 2:
        errors.append("Username must be at least 2 characters.")
    if not data.get("email"):
        errors.append("Email is required.")
    elif not EMAIL_REGEX.match(data["email"].strip()):
        errors.append("Invalid email format.")
    if not data.get("password") or len(data["password"]) < 6:
        errors.append("Password must be at least 6 characters.")
    return errors


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    errors = _validate_register(data)
    if errors:
        return jsonify({"error": " ".join(errors)}), 400
    username = data["username"].strip()
    email = data["email"].strip().lower()
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered."}), 400
    user = User(username=username, email=email, password_hash="")
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=user.id)
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Username and password required."}), 400
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials."}), 401
    access_token = create_access_token(identity=user.id)
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(user.to_dict()), 200
