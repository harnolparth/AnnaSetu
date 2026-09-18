import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from ..db import get_db
from ..utils import require_fields, row_to_dict, error

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register/<user_type>")
def register(user_type):
    user_type = user_type.lower()
    if user_type not in {"donor", "ngo", "volunteer"}:
        return error("user_type must be donor, ngo, or volunteer")
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["name", "email", "phone", "address", "password"])
    if missing:
        return error(missing)
    password_hash = generate_password_hash(data["password"])
    with get_db() as conn:
        try:
            if user_type == "donor":
                row = conn.execute(
                    """INSERT INTO donor (name,email,phone,address,donor_type,password_hash)
                       VALUES (%s,%s,%s,%s,%s,%s)
                       RETURNING donor_id,name,email,phone,address,donor_type""",
                    (data["name"], data["email"], data["phone"], data["address"],
                     data.get("donor_type", "Individual"), password_hash)
                ).fetchone()
            elif user_type == "ngo":
                row = conn.execute(
                    """INSERT INTO ngo (ngo_name,email,phone,address,password_hash)
                       VALUES (%s,%s,%s,%s,%s)
                       RETURNING ngo_id,ngo_name,email,phone,address""",
                    (data["name"], data["email"], data["phone"], data["address"], password_hash)
                ).fetchone()
            else:
                row = conn.execute(
                    """INSERT INTO volunteer (name,email,phone,address,vehicle,availability,password_hash)
                       VALUES (%s,%s,%s,%s,%s,%s,%s)
                       RETURNING volunteer_id,name,email,phone,address,vehicle,availability""",
                    (data["name"], data["email"], data["phone"], data["address"],
                     data.get("vehicle"), data.get("availability", True), password_hash)
                ).fetchone()
            conn.commit()
            return jsonify({"message": f"{user_type.capitalize()} registered successfully", "user": row_to_dict(row)}), 201
        except Exception as exc:
            conn.rollback()
            if "unique" in str(exc).lower() or "duplicate key" in str(exc).lower():
                return error("Email is already registered", 409)
            return error("Registration failed", 500)

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    missing = require_fields(data, ["email", "password", "user_type"])
    if missing:
        return error(missing)
    user_type = data["user_type"].lower()
    if user_type == "admin":
        if data["email"] != os.getenv("ADMIN_EMAIL", "admin@example.com") or data["password"] != os.getenv("ADMIN_PASSWORD", "Admin@123"):
            return error("Invalid admin credentials", 401)
        token = create_access_token(identity="admin:0", additional_claims={"user_type":"admin", "user_id":0})
        return jsonify({"access_token":token,"user_type":"admin","user_id":0})
    if user_type not in {"donor", "ngo", "volunteer"}:
        return error("user_type must be donor, ngo, volunteer, or admin")
    with get_db() as conn:
        if user_type == "donor":
            row = conn.execute("SELECT donor_id AS id,name,email,password_hash FROM donor WHERE LOWER(email)=LOWER(%s)", (data["email"],)).fetchone()
        elif user_type == "ngo":
            row = conn.execute("SELECT ngo_id AS id,ngo_name AS name,email,password_hash FROM ngo WHERE LOWER(email)=LOWER(%s)", (data["email"],)).fetchone()
        else:
            row = conn.execute("SELECT volunteer_id AS id,name,email,password_hash FROM volunteer WHERE LOWER(email)=LOWER(%s)", (data["email"],)).fetchone()
    if not row or not check_password_hash(row["password_hash"], data["password"]):
        return error("Invalid email or password", 401)
    token = create_access_token(identity=f"{user_type}:{row['id']}", additional_claims={"user_type":user_type,"user_id":row["id"]})
    return jsonify({"access_token":token,"user_type":user_type,"user_id":row["id"],"name":row["name"]})
