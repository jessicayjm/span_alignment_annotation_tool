import flask
import compAnn
import pandas as pd
from flask_jwt_extended import jwt_required, get_jwt_identity

@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotations/delete_alignment', methods=['POST'])
@jwt_required()
def delete_alignment(project_id, text_id):
    connection = compAnn.model.get_db()
    alignment_id = flask.request.json['id']
    try:
        connection.execute(
            "DELETE FROM alignments "
            "WHERE id = ?;",
            (alignment_id,)
        )
    except Exception as e:
      return e
    return flask.jsonify({'ok':True, 
                        'message': 'successfully delete alignment'
                    }),\
        200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotations/add_alignment', methods=['POST'])
@jwt_required()
def add_alignment(project_id, text_id):
    connection = compAnn.model.get_db()
    is_admin = flask.request.json['isAdmin']
    target_ann_id = flask.request.json['target_ann_id']
    observer_ann_id = flask.request.json['observer_ann_id']

    if is_admin:
        annotator_id = 1
    else:
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
    try:
        connection.execute(
            "INSERT OR IGNORE INTO alignments(target_ann_id, observer_ann_id, annotator_id) "
            "VALUES(?, ?, ?);",
            (target_ann_id, observer_ann_id, annotator_id,)
        )
        alignment = connection.execute(
            "SELECT DISTINCT(A.id), A1.span AS target_span, A2.span AS observer_span, "
            "L1.name AS target_label, L1.color AS target_color, "
            "L2.name AS observer_label, L2.color AS observer_color "
            "FROM alignments AS A, annotations AS A1, annotations AS A2, labels AS L1, labels AS L2 "
            "WHERE A.annotator_id=? "
            "AND A.target_ann_id=? "
            "AND A.observer_ann_id=? "
            "AND A.target_ann_id=A1.id "
            "AND A1.label_id = L1.id "
            "AND A.observer_ann_id=A2.id "
            "AND A2.label_id = L2.id ",
            (annotator_id, target_ann_id, observer_ann_id,)
        ).fetchone()
    except Exception as e:
      return e
    return flask.jsonify({'ok':True, 
                        'id': alignment['id'],
                        'alignment': {
                            'target_span': alignment['target_span'],
                            'observer_span': alignment['observer_span'],
                            'target_label': alignment['target_label'],
                            'observer_label': alignment['observer_label'],
                            'target_color': alignment['target_color'],
                            'observer_color': alignment['observer_color']
                        },
                        'message': 'successfully add alignment'
                    }),\
        200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotations/checkbox_modify_final_alignment', methods=['POST'])
@jwt_required()
def checkbox_modify_final_alignment(project_id, text_id):
    connection = compAnn.model.get_db()
    alignment_id = flask.request.json['alignment_id']
    operation = flask.request.json['operation']

    # check if is admin
    try:
      email = get_jwt_identity()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: invalid token'
                                  }),\
                 400, {'ContentType':'application/json'}
    try:
      is_admin = connection.execute(
          "SELECT isAdmin FROM project_annotators AS PA, annotators AS A "
          "WHERE A.email=? "
          "AND A.id=PA.annotator_id "
          "AND PA.project_id=?;",
          (email, project_id)
      ).fetchone()
    except Exception as e:
        return flask.jsonify({'ok':False, 
                            'message': 'Cannot get admin info'
                            }),\
            500, {'ContentType':'application/json'}
    if not is_admin:
        return flask.jsonify({'ok':False, 
                                    'message': 'Unauthorized'
                                    }),\
                    400, {'ContentType':'application/json'}
    annotator_id = 1
    # find the alignment target_ann_id, observer_ann_id
    try:
        alignment_record = connection.execute(
            "SELECT target_ann_id, observer_ann_id FROM alignments "
            "WHERE id = ?",
            (alignment_id,)
        ).fetchone()
        target_ann_id = alignment_record['target_ann_id']
        observer_ann_id = alignment_record['observer_ann_id']
    except Exception as e:
      return flask.jsonify({'ok':False, 
                            'message': 'Cannot find such alignment'
                            }),\
            500, {'ContentType':'application/json'}  
    try:
        if operation == "add":
            connection.execute(
                "INSERT OR IGNORE INTO alignments(target_ann_id, observer_ann_id, annotator_id) "
                "VALUES(?, ?, ?);",
                (target_ann_id, observer_ann_id, annotator_id,)
            )
        elif operation == "delete":
            connection.execute(
                "DELETE FROM alignments WHERE "
                "target_ann_id = ? AND "
                "observer_ann_id = ? AND "
                "annotator_id = ?",
                (target_ann_id, observer_ann_id, annotator_id,)
            )
        else:
            return flask.jsonify({'ok':False, 
                            'message': 'Operation not exist'
                            }),\
            400, {'ContentType':'application/json'}
    except Exception as e:
      return flask.jsonify({'ok':False, 
                            'message': 'Cannot update final alignment'
                            }),\
            500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                        'message': 'successfully update alignment'
                    }),\
        200, {'ContentType':'application/json'}