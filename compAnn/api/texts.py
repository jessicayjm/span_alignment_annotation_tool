import flask
import compAnn
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd

action_type_list = ['annotate spans', 'annotate alignment', 'review spans', 'review alignment']
action_type_dict = {
    'annotate spans': 0,
    'annotate alignment': 1, 
    'review spans': 2,
    'review alignment': 3
}

@compAnn.app.route('/projects/<int:project_id>/<int:length>', methods=['GET'])
@jwt_required()
def get_texts(project_id, length):
    connection = compAnn.model.get_db()
    try:
        text_list = connection.execute(
            "SELECT TI.*, COUNT(DISTINCT A.annotator_id) AS annotated_by "
            "FROM (SELECT T.id, substr(T.full_text, 1, ?) AS partial_text, "
            "P.finalized, P.review_status "
            "FROM texts AS T, project_texts AS P "
            "WHERE T.id = P.text_id AND P.project_id = ? "
            "ORDER BY T.id ASC) AS TI "
            "LEFT JOIN ("
            "SELECT * FROM annotations where annotator_id!=1 AND project_id=?"
            ") AS A "
            "ON A.text_id=TI.id "
			"GROUP BY TI.id;",
            (length, project_id, project_id,)
        ).fetchall()
    except Exception as e:
        return e
    texts = pd.DataFrame(text_list)
    texts['partial_text'] = texts['partial_text'] + '...'
    texts['display_id'] = pd.Series(range(1,len(texts)+1))
    context = {
        "texts": texts.to_dict('records')
    }
    return flask.jsonify(**context)
 

@compAnn.app.route('/jobs/<int:project_id>/<int:length>', methods=['POST'])
@jwt_required()
def get_annotate_texts(project_id, length):
    action_type = action_type_dict[flask.request.json['action_type']]
    try:
      email = get_jwt_identity()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: invalid token'
                                  }),\
                 400, {'ContentType':'application/json'}

    connection = compAnn.model.get_db()

    try:
      annotator_id = connection.execute(
        "SELECT id FROM annotators "
        "WHERE email = ?;",
        (email, )
    ).fetchone()['id']
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get annotator id'
                                  }),\
                 500, {'ContentType':'application/json'}
    
    # get the texts that need to be annotated for a specific project
    try:
        texts = connection.execute(
          "SELECT T.id, substr(T.full_text, 1, ?) AS partial_text, JA.status "
          "FROM job_actions AS JA, texts AS T "
          "WHERE JA.project_id = ? "
          "AND JA.action_type = ? "
          "AND JA.annotator_id = ? "
          "AND JA.text_id = T.id "
          "ORDER BY T.id;",
          (length, project_id, action_type, annotator_id,)
        ).fetchall()
        texts = pd.DataFrame(texts)
        texts['partial_text'] = texts['partial_text'] + '...'
        texts['display_id'] = pd.Series(range(1,len(texts)+1))
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get texts to annotate'
                                  }),\
                 500, {'ContentType':'application/json'}

    context = {
        "texts": texts.to_dict('records')
    }
    return flask.jsonify(**context)
 
