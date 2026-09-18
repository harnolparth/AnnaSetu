from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from ..db import get_db
from ..auth_utils import roles_required
from ..utils import require_fields, row_to_dict, rows_to_list, error

donor_bp = Blueprint("donor", __name__)

def donor_id():
    return int(get_jwt()["user_id"])

@donor_bp.post("/donations")
@roles_required("donor")
def create_donation():
    data = request.get_json(silent=True) or {}
    fields = ["food_name","food_type","quantity","no_of_meals","available_from","available_until","expiry_date","pickup_address"]
    missing = require_fields(data, fields)
    if missing: return error(missing)
    try:
        quantity = float(data["quantity"]); meals = int(data["no_of_meals"])
        start = datetime.fromisoformat(data["available_from"])
        until = datetime.fromisoformat(data["available_until"])
        expiry = datetime.fromisoformat(data["expiry_date"])
    except (ValueError, TypeError):
        return error("Use ISO datetime values such as 2026-09-20T18:00:00")
    if quantity <= 0 or meals <= 0: return error("quantity and no_of_meals must be greater than zero")
    if not (start < until <= expiry): return error("Require available_from < available_until <= expiry_date")
    with get_db() as conn:
        try:
            row = conn.execute(
                """INSERT INTO food_donation (donor_id,food_name,food_type,quantity,no_of_meals,available_from,available_until,expiry_date,pickup_address,status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'Available') RETURNING *""",
                (donor_id(),data["food_name"],data["food_type"],quantity,meals,start,until,expiry,data["pickup_address"])
            ).fetchone(); conn.commit()
            return jsonify({"message":"Food donation created","donation":row_to_dict(row)}),201
        except Exception:
            conn.rollback(); return error("Could not create donation",500)

@donor_bp.get("/donations")
@roles_required("donor")
def my_donations():
    with get_db() as conn:
        rows=conn.execute("SELECT * FROM food_donation WHERE donor_id=%s ORDER BY donation_id DESC",(donor_id(),)).fetchall()
    return jsonify({"donations":rows_to_list(rows)})

@donor_bp.get("/donations/<int:donation_id>")
@roles_required("donor")
def get_donation(donation_id):
    with get_db() as conn:
        row=conn.execute("SELECT * FROM food_donation WHERE donation_id=%s AND donor_id=%s",(donation_id,donor_id())).fetchone()
    if not row: return error("Donation not found",404)
    return jsonify({"donation":row_to_dict(row)})

@donor_bp.put("/donations/<int:donation_id>")
@roles_required("donor")
def update_donation(donation_id):
    data=request.get_json(silent=True) or {}
    allowed=["food_name","food_type","quantity","no_of_meals","available_from","available_until","expiry_date","pickup_address"]
    updates={k:data[k] for k in allowed if k in data}
    if not updates: return error("No editable fields supplied")
    parts=[]; vals=[]
    for k,v in updates.items(): parts.append(f"{k}=%s"); vals.append(v)
    vals += [donation_id, donor_id()]
    with get_db() as conn:
        try:
            row=conn.execute(f"UPDATE food_donation SET {', '.join(parts)} WHERE donation_id=%s AND donor_id=%s AND status IN ('Available','Pending') RETURNING *",vals).fetchone()
            if not row: conn.rollback(); return error("Donation not found or cannot be edited",409)
            conn.commit(); return jsonify({"message":"Donation updated","donation":row_to_dict(row)})
        except Exception:
            conn.rollback(); return error("Could not update donation",500)

@donor_bp.delete("/donations/<int:donation_id>")
@roles_required("donor")
def cancel_donation(donation_id):
    with get_db() as conn:
        row=conn.execute("UPDATE food_donation SET status='Cancelled' WHERE donation_id=%s AND donor_id=%s AND status IN ('Available','Pending') RETURNING *",(donation_id,donor_id())).fetchone()
        if not row: conn.rollback(); return error("Donation not found or cannot be cancelled",409)
        conn.commit()
    return jsonify({"message":"Donation cancelled","donation":row_to_dict(row)})

@donor_bp.get("/donations/<int:donation_id>/requests")
@roles_required("donor")
def donation_requests(donation_id):
    with get_db() as conn:
        rows=conn.execute("""SELECT r.*,n.ngo_name FROM request r JOIN ngo n ON n.ngo_id=r.ngo_id JOIN food_donation d ON d.donation_id=r.donation_id WHERE r.donation_id=%s AND d.donor_id=%s ORDER BY r.request_id DESC""",(donation_id,donor_id())).fetchall()
    return jsonify({"requests":rows_to_list(rows)})

@donor_bp.patch("/requests/<int:request_id>/decision")
@roles_required("donor")
def request_decision(request_id):
    data=request.get_json(silent=True) or {}; decision=str(data.get("decision","")).lower()
    if decision not in {"accept","reject"}: return error("decision must be accept or reject")
    with get_db() as conn:
        try:
            req=conn.execute("""SELECT r.request_id,r.donation_id,r.ngo_id,r.status AS request_status,d.status AS donation_status,d.donor_id FROM request r JOIN food_donation d ON d.donation_id=r.donation_id WHERE r.request_id=%s AND d.donor_id=%s FOR UPDATE OF r,d""",(request_id,donor_id())).fetchone()
            if not req: conn.rollback(); return error("Request not found",404)
            if req["request_status"]!="Pending": conn.rollback(); return error("This request has already been processed",409)
            if decision=="reject":
                conn.execute("UPDATE request SET status='Rejected' WHERE request_id=%s",(request_id,))
                conn.execute("INSERT INTO notification(user_id,user_type,message,notification_type) VALUES(%s,'ngo','Your donation request was rejected by the donor','Request Rejected')",(req["ngo_id"],))
                conn.commit(); return jsonify({"message":"Request rejected"})
            if req["donation_status"]!="Available": conn.rollback(); return error("Donation is no longer available",409)
            conn.execute("UPDATE request SET status='Accepted' WHERE request_id=%s",(request_id,))
            conn.execute("UPDATE food_donation SET status='Accepted' WHERE donation_id=%s",(req["donation_id"],))
            conn.execute("UPDATE request SET status='Rejected' WHERE donation_id=%s AND request_id<>%s AND status='Pending'",(req["donation_id"],request_id))
            delivery=conn.execute("INSERT INTO delivery(request_id,status) VALUES(%s,'Available') RETURNING *",(request_id,)).fetchone()
            conn.execute("INSERT INTO notification(user_id,user_type,message,notification_type) VALUES(%s,'ngo','Your donation request was accepted and a delivery task is available','Request Accepted')",(req["ngo_id"],))
            conn.execute("INSERT INTO notification(user_id,user_type,message,notification_type) SELECT volunteer_id,'volunteer','A new food delivery task is available','Delivery Available' FROM volunteer WHERE availability=true")
            conn.commit()
            return jsonify({"message":"Request accepted; other pending requests rejected and delivery created","delivery":row_to_dict(delivery)})
        except Exception:
            conn.rollback(); return error("Could not process donor decision",500)
