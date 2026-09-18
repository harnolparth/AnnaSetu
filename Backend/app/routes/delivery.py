from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from ..db import get_db
from ..auth_utils import roles_required
from ..utils import row_to_dict, rows_to_list, error

delivery_bp=Blueprint("delivery",__name__)

def volunteer_id(): return int(get_jwt()["user_id"])

@delivery_bp.get("/available")
@roles_required("volunteer")
def available():
    with get_db() as conn:
        rows=conn.execute("""SELECT dl.delivery_id,dl.status,r.request_id,d.donation_id,d.food_name,d.food_type,d.quantity,d.no_of_meals,d.pickup_address,d.available_until,d.expiry_date,dn.name AS donor_name,dn.phone AS donor_phone,n.ngo_name,n.phone AS ngo_phone,n.address AS ngo_address FROM delivery dl JOIN request r ON r.request_id=dl.request_id JOIN food_donation d ON d.donation_id=r.donation_id JOIN donor dn ON dn.donor_id=d.donor_id JOIN ngo n ON n.ngo_id=r.ngo_id WHERE dl.status='Available' AND d.status='Accepted' AND d.expiry_date>NOW() ORDER BY d.expiry_date ASC""").fetchall()
    return jsonify({"deliveries":rows_to_list(rows)})

@delivery_bp.get("/my")
@roles_required("volunteer")
def my():
    with get_db() as conn:
        rows=conn.execute("""SELECT dl.*,r.request_id,d.donation_id,d.food_name,d.quantity,d.no_of_meals,d.pickup_address,n.ngo_name,n.address AS ngo_address FROM delivery dl JOIN request r ON r.request_id=dl.request_id JOIN food_donation d ON d.donation_id=r.donation_id JOIN ngo n ON n.ngo_id=r.ngo_id WHERE dl.volunteer_id=%s ORDER BY dl.delivery_id DESC""",(volunteer_id(),)).fetchall()
    return jsonify({"deliveries":rows_to_list(rows)})

@delivery_bp.post("/<int:delivery_id>/accept")
@roles_required("volunteer")
def accept(delivery_id):
    vid=volunteer_id()
    with get_db() as conn:
        try:
            delivery=conn.execute("""SELECT dl.delivery_id,dl.status,dl.volunteer_id,r.ngo_id,d.donation_id,d.donor_id FROM delivery dl JOIN request r ON r.request_id=dl.request_id JOIN food_donation d ON d.donation_id=r.donation_id WHERE dl.delivery_id=%s FOR UPDATE OF dl""",(delivery_id,)).fetchone()
            if not delivery: conn.rollback(); return error("Delivery not found",404)
            if delivery["status"]!="Available" or delivery["volunteer_id"] is not None: conn.rollback(); return error("This delivery has already been accepted by another volunteer",409)
            v=conn.execute("SELECT availability FROM volunteer WHERE volunteer_id=%s FOR UPDATE",(vid,)).fetchone()
            if not v: conn.rollback(); return error("Volunteer not found",404)
            if not v["availability"]: conn.rollback(); return error("Set your availability to true before accepting a delivery",409)
            row=conn.execute("UPDATE delivery SET volunteer_id=%s,status='Accepted' WHERE delivery_id=%s AND status='Available' AND volunteer_id IS NULL RETURNING *",(vid,delivery_id)).fetchone()
            if not row: conn.rollback(); return error("Another volunteer accepted this delivery first",409)
            for uid,utype,msg in [(delivery["donor_id"],"donor","A volunteer accepted the delivery for your donation"),(delivery["ngo_id"],"ngo","A volunteer accepted your food delivery"),(vid,"volunteer","You accepted the delivery task")]:
                conn.execute("INSERT INTO notification(user_id,user_type,message,notification_type) VALUES(%s,%s,%s,'Delivery Accepted')",(uid,utype,msg))
            conn.commit(); return jsonify({"message":"Delivery accepted successfully","delivery":row_to_dict(row)})
        except Exception:
            conn.rollback(); return error("Could not accept delivery",500)

@delivery_bp.patch("/<int:delivery_id>/status")
@roles_required("volunteer")
def update_status(delivery_id):
    new_status=str((request.get_json(silent=True) or {}).get("status","")).strip().title()
    if new_status not in {"Picked Up","On The Way","Delivered"}: return error("status must be Picked Up, On The Way, or Delivered")
    with get_db() as conn:
        try:
            d=conn.execute("""SELECT dl.*,r.request_id,r.ngo_id,fd.donation_id,fd.donor_id FROM delivery dl JOIN request r ON r.request_id=dl.request_id JOIN food_donation fd ON fd.donation_id=r.donation_id WHERE dl.delivery_id=%s AND dl.volunteer_id=%s FOR UPDATE OF dl""",(delivery_id,volunteer_id())).fetchone()
            if not d: conn.rollback(); return error("Delivery not found or not assigned to you",404)
            transitions={"Accepted":{"Picked Up"},"Picked Up":{"On The Way"},"On The Way":{"Delivered"}}
            if new_status not in transitions.get(d["status"],set()): conn.rollback(); return error(f"Invalid status transition from '{d['status']}' to '{new_status}'",409)
            if new_status=="Picked Up":
                row=conn.execute("UPDATE delivery SET status=%s,pickup_time=NOW() WHERE delivery_id=%s RETURNING *",(new_status,delivery_id)).fetchone()
            elif new_status=="Delivered":
                row=conn.execute("UPDATE delivery SET status=%s,delivery_time=NOW() WHERE delivery_id=%s RETURNING *",(new_status,delivery_id)).fetchone()
                conn.execute("UPDATE food_donation SET status='Delivered' WHERE donation_id=%s",(d["donation_id"],))
                conn.execute("UPDATE request SET status='Completed' WHERE request_id=%s",(d["request_id"],))
            else:
                row=conn.execute("UPDATE delivery SET status=%s WHERE delivery_id=%s RETURNING *",(new_status,delivery_id)).fetchone()
            for uid,utype in [(d["donor_id"],"donor"),(d["ngo_id"],"ngo")]:
                conn.execute("INSERT INTO notification(user_id,user_type,message,notification_type) VALUES(%s,%s,%s,'Delivery Status Update')",(uid,utype,f"Delivery status updated to {new_status}"))
            conn.commit(); return jsonify({"message":f"Delivery status updated to {new_status}","delivery":row_to_dict(row)})
        except Exception:
            conn.rollback(); return error("Could not update delivery status",500)
