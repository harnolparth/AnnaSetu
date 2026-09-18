from flask import Blueprint, jsonify
from ..auth_utils import roles_required
from ..db import get_db
from ..utils import row_to_dict

admin_bp=Blueprint("admin",__name__)

@admin_bp.get("/stats")
@roles_required("admin")
def stats():
    with get_db() as conn:
        data={}
        for key,table in [("donors","donor"),("ngos","ngo"),("volunteers","volunteer"),("donations","food_donation"),("requests","request"),("deliveries","delivery"),("notifications","notification")]:
            data[key]=conn.execute(f"SELECT COUNT(*) AS count FROM {table}").fetchone()["count"]
        data["completed_deliveries"]=conn.execute("SELECT COUNT(*) AS count FROM delivery WHERE status='Delivered'").fetchone()["count"]
        data["available_donations"]=conn.execute("SELECT COUNT(*) AS count FROM food_donation WHERE status='Available'").fetchone()["count"]
    return jsonify({"stats":data})

@admin_bp.get("/users")
@roles_required("admin")
def users():
    with get_db() as conn:
        rows=[]
        rows += conn.execute("SELECT donor_id AS id,name,email,phone,'donor' AS user_type FROM donor ORDER BY donor_id").fetchall()
        rows += conn.execute("SELECT ngo_id AS id,ngo_name AS name,email,phone,'ngo' AS user_type FROM ngo ORDER BY ngo_id").fetchall()
        rows += conn.execute("SELECT volunteer_id AS id,name,email,phone,'volunteer' AS user_type FROM volunteer ORDER BY volunteer_id").fetchall()
    return jsonify({"users":[row_to_dict(r) for r in rows]})
