from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt
from ..db import get_db
from ..auth_utils import roles_required
from ..utils import row_to_dict, rows_to_list, error

notification_bp=Blueprint("notification",__name__)

@notification_bp.get("")
@roles_required("donor","ngo","volunteer","admin")
def notifications():
    c=get_jwt(); uid=int(c["user_id"]); utype=c["user_type"]
    with get_db() as conn:
        if utype=="admin": rows=conn.execute("SELECT * FROM notification ORDER BY notification_id DESC").fetchall()
        else: rows=conn.execute("SELECT * FROM notification WHERE user_id=%s AND user_type=%s ORDER BY notification_id DESC",(uid,utype)).fetchall()
    return jsonify({"notifications":rows_to_list(rows)})

@notification_bp.patch("/<int:notification_id>/read")
@roles_required("donor","ngo","volunteer")
def mark_read(notification_id):
    c=get_jwt()
    with get_db() as conn:
        row=conn.execute("UPDATE notification SET is_read=true WHERE notification_id=%s AND user_id=%s AND user_type=%s RETURNING *",(notification_id,int(c["user_id"]),c["user_type"])).fetchone()
        if not row: conn.rollback(); return error("Notification not found",404)
        conn.commit()
    return jsonify({"notification":row_to_dict(row)})
