from datetime import date, datetime
from decimal import Decimal
from flask import jsonify
from flask_jwt_extended import get_jwt

def json_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value

def row_to_dict(row):
    if row is None:
        return None
    return {k: json_value(v) for k, v in dict(row).items()}

def rows_to_list(rows):
    return [row_to_dict(row) for row in rows]

def error(message, status=400):
    return jsonify({"error": message}), status

def require_fields(data, fields):
    missing = [field for field in fields if data.get(field) in (None, "")]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    return None

def current_identity():
    claims = get_jwt()
    return claims.get("user_type"), claims.get("user_id")
