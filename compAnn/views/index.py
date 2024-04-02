import flask
import compAnn

@compAnn.app.route('/', defaults={'path': ''})
@compAnn.app.route('/<path:path>')
def catch_all(path):
    return flask.render_template("index.html")
