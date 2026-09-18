from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from ..db import get_db
from ..auth_utils import roles_required
from ..utils import row_to_dict, rows_to_list, error

ngo_bp=Blueprint("ngo",__name__)

def ngo_id(): return int(get_jwt()["user_id"])

@ngo_bp.get("/donations/available")
@roles_required("ngo")
def available_donations():
    with get_db() as conn:
        rows=conn.execute("""SELECT d.*,dn.name AS donor_name,dn.phone AS donor_phone FROM food_donation d JOIN donor dn ON dn.donor_id=d.donor_id WHERE d.status='Available' AND d.available_from<=NOW() AND d.available_until>=NOW() AND d.expiry_date>NOW() ORDER BY d.expiry_date ASC""").fetchall()
    return jsonify({"donations":rows_to_list(rows)})

@ngo_bp.post("/donations/<int:donation_id>/requests")
@roles_required("ngo")
def request_donation(donation_id):
    with get_db() as conn:
        try:
            donation=conn.execute("SELECT donation_id,status,donor_id FROM food_donation WHERE donation_id=%s FOR UPDATE",(donation_id,)).fetchone()
            if not donation: conn.rollback(); return error("Donation not found",404)
            if donation["status"]!="Available": conn.rollback(); return error("Donation is no longer available",409)
            existing=conn.execute("SELECT request_id,status FROM request WHERE donation_id=%s AND ngo_id=%s AND status IN ('Pending','Accepted') LIMIT 1",(donation_id,ngo_id())).fetchone()
            if existing: conn.rollback(); return error("You already have a pending or accepted request for this donation",409)
            row=conn.execute("INSERT INTO request(donation_id,ngo_id,status) VALUES(%s,%s,'Pending') RETURNING *",(donation_id,ngo_id())).fetchone()
            conn.execute("INSERT INTO notification(user_id,user_type,message,notification_type) VALUES(%s,'donor','A new NGO has requested your food donation','New Donation Request')",(donation["donor_id"],))
            conn.commit(); return jsonify({"message":"Donation request sent to donor","request":row_to_dict(row)}),201
        except Exception:
            conn.rollback(); return error("Could not create donation request",500)

@ngo_bp.get("/requests")
@roles_required("ngo")
def my_requests():
    with get_db() as conn:
        rows=conn.execute("""SELECT r.*,d.food_name,d.quantity,d.no_of_meals,d.pickup_address,dn.name AS donor_name FROM request r JOIN food_donation d ON d.donation_id=r.donation_id JOIN donor dn ON dn.donor_id=d.donor_id WHERE r.ngo_id=%s ORDER BY r.request_id DESC""",(ngo_id(),)).fetchall()
    return jsonify({"requests":rows_to_list(rows)})

@ngo_bp.get("/deliveries")
@roles_required("ngo")
def my_deliveries():
    with get_db() as conn:
        rows=conn.execute("""SELECT dl.*,r.ngo_id,d.food_name,d.quantity,d.no_of_meals,d.pickup_address,dn.name AS donor_name,v.name AS volunteer_name,v.phone AS volunteer_phone FROM delivery dl JOIN request r ON r.request_id=dl.request_id JOIN food_donation d ON d.donation_id=r.donation_id JOIN donor dn ON dn.donor_id=d.donor_id LEFT JOIN volunteer v ON v.volunteer_id=dl.volunteer_id WHERE r.ngo_id=%s ORDER BY dl.delivery_id DESC""",(ngo_id(),)).fetchall()
    return jsonify({"deliveries":rows_to_list(rows)})

@ngo_bp.get("/profile")
@roles_required("ngo")
def profile():
    with get_db() as conn:
        row=conn.execute("SELECT ngo_id,ngo_name,email,phone,address FROM ngo WHERE ngo_id=%s",(ngo_id(),)).fetchone()
    return jsonify({"ngo":row_to_dict(row)})
