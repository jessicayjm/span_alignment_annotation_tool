import compAnn
import json
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import create_access_token,get_jwt,get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash


def generate_token(id):
    return create_access_token(identity=id)


def encode_password(password):
   return generate_password_hash(password)


def verify_password(password_hash, password_input):
    return check_password_hash(password_hash, password_input)


# code from: 
# https://dev.to/nagatodev/how-to-add-login-authentication-to-a-flask-and-react-application-23i7
@compAnn.app.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + compAnn.app.config['JWT_ACCESS_TOKEN_EXPIRES'])
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token 
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original response
        return response