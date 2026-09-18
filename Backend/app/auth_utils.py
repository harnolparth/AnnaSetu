from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required
from .utils import current_identity

def roles_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_type, _ = current_identity()
            if user_type not in roles:
                return jsonify({"error": "You do not have permission for this action"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
