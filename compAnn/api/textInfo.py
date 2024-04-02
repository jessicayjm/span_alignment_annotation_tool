import flask
import compAnn
from flask_jwt_extended import jwt_required

@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/info', methods=['GET'])
@jwt_required()
def get_textinfo(project_id, text_id):
    connection = compAnn.model.get_db()
    try:
        text = connection.execute(
            "SELECT full_text from texts "
            "WHERE id=?",
            (text_id,)
        ).fetchone()
    except Exception as e:
        return e
    context = {
        "text": text,
    }
    return flask.jsonify(**context)
