from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from ..db import get_db
from ..auth_utils import roles_required
from ..utils import row_to_dict, error

volunteer_bp=Blueprint("volunteer",__name__)

def volunteer_id(): return int(get_jwt()["user_id"])

@volunteer_bp.get("/profile")
@roles_required("volunteer")
def profile():
    with get_db() as conn:
        row=conn.execute("SELECT volunteer_id,name,email,phone,address,vehicle,availability FROM volunteer WHERE volunteer_id=%s",(volunteer_id(),)).fetchone()
    return jsonify({"volunteer":row_to_dict(row)})

@volunteer_bp.patch("/availability")
@roles_required("volunteer")
def update_availability():
    data=request.get_json(silent=True) or {}
    if not isinstance(data.get("availability"),bool): return error("availability must be true or false")
    with get_db() as conn:
        row=conn.execute("UPDATE volunteer SET availability=%s WHERE volunteer_id=%s RETURNING volunteer_id,name,availability",(data["availability"],volunteer_id())).fetchone(); conn.commit()
    return jsonify({"message":"Availability updated","volunteer":row_to_dict(row)})
