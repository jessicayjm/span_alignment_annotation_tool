import flask
from flask_jwt_extended import JWTManager
from datetime import timedelta


app = flask.Flask(__name__)

app.config.from_object('compAnn.config')

app.config.from_object('compAnn.services.config')

app.config.from_envvar('COMPANN_SETTINGS', silent=True)

app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

jwt = JWTManager(app)

import compAnn.api
import compAnn.views
import compAnn.model
