import flask
import compAnn
import pandas as pd
from flask_jwt_extended import jwt_required

@compAnn.app.route('/projects/<int:project_id>/labels-info', methods=['GET'])
@jwt_required()
def get_labels(project_id):
    connection = compAnn.model.get_db()
    try:
        labels = connection.execute(
            "SELECT name, id, color from labels "
            "WHERE project_id=?",
            (project_id,)
        ).fetchall()
    except Exception as e:
        return e
    label_df = pd.DataFrame(labels)
    label_dict = label_df.set_index('name').T.to_dict()
    context = {
        "labels": label_dict
    }
    return flask.jsonify(**context)