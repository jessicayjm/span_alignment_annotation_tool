import flask
import compAnn
from flask_jwt_extended import jwt_required, get_jwt_identity

@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotation-submit', methods=['POST'])
@jwt_required()
def post_anns(project_id, text_id):

    connection = compAnn.model.get_db()
    isFinalAnn = flask.request.json['isFinalAnn']
    updateJobSubmit = flask.request.json['updateJobSubmit']

    if not isFinalAnn:
        try:
            email = get_jwt_identity()
        except Exception as e:
                return flask.jsonify({'ok':False, 
                                    'message': 'Error: invalid token'
                                    }),\
                    400, {'ContentType':'application/json'}
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
    else:
        annotator_id = 1

    update_id = None
    if updateJobSubmit:
        try:
            # for this submission, it can only be "annotate spans" job type
            # validate that there is only one job corresponding to the submission
            update_id = connection.execute(
                "SELECT id from job_actions "
                "WHERE project_id = ? "
                "AND text_id = ? "
                "AND annotator_id = ? "
                "AND action_type = 0;",
                (project_id, text_id, annotator_id,)
            ).fetchall()
            if len(update_id) != 1: 
                # if update the job status, there should be exactly one entry in db
                return flask.jsonify({'ok':False, 
                                    'message': 'Error: job not found or multiple jobs found'
                                    }),\
                    400, {'ContentType':'application/json'}
        except Exception as e:
            return e
    
    seg_start = flask.request.json['seg_start']
    seg_end = flask.request.json['seg_end']
    annotations = flask.request.json['annotations']
    # delete data from (seg_start+ 1, seg_end)
        ################
        # important: assume annotation
        # always falls in this range
        # so the split of annotation is not checked
        ################
    try:
        connection.execute(
            "DELETE FROM annotations "
            "WHERE project_id = ? AND "
            "text_id = ? AND "
            "annotator_id = ? AND "
            "span_start >= ? AND "
            "span_end <= ? ",
            (project_id, text_id, annotator_id, seg_start, seg_end)
        )
    except Exception as e:
        return e
    for ann in annotations:
        # insert the new annotations
        try:
            connection.execute(
                "INSERT OR IGNORE INTO annotations(project_id, text_id, annotator_id, label_id, span_start, span_end, span) "
                "VALUES(?, ?, ?, ?, ?, ?, ?);",
                (project_id, text_id, annotator_id, ann['tag_id'], ann['start']+seg_start, ann['end']+seg_start, ann['text'])
            )
        except Exception as e:
            return e
    
    if updateJobSubmit:
        try:
            update_id = update_id[0]['id']
            connection.execute(
                "UPDATE job_actions SET status = 2 WHERE id = ?;",
                (update_id,)
            )
        except Exception as e:
            return e
    
    return flask.jsonify({'ok':True}), 200, {'ContentType':'application/json'} 