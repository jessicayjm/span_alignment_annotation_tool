import flask
import compAnn
import pandas as pd
from flask_jwt_extended import jwt_required

@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/get_review_status', methods=['GET'])
@jwt_required()
def get_review_status(project_id, text_id):
    connection = compAnn.model.get_db()
    try:
        review_status = connection.execute(
            "SELECT review_status FROM project_texts "
            "WHERE project_id=? AND text_id=?;",
            (project_id, text_id, )
        ).fetchone()['review_status']
    except Exception as e:
          return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot get review status'
                                }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                           'message': 'successfully get review status.',
                           'review_status': review_status,
                        }),\
                200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/set_review_status', methods=['POST'])
@jwt_required()
def set_review_status(project_id, text_id):
    connection = compAnn.model.get_db()
    review_status = flask.request.json['review_status']
    try:
        connection.execute(
            "UPDATE project_texts SET review_status=? "
            "WHERE project_id=? AND text_id=?;",
            (review_status, project_id, text_id, )
        )
    except Exception as e:
          return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot update review status'
                                }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                          'message': 'successfully update review status.',
                          'review_status': review_status,
                        }),\
                200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/get_finalized_status', methods=['GET'])
@jwt_required()
def get_finalized_status(project_id, text_id):
    connection = compAnn.model.get_db()
    try:
        isFinalized = connection.execute(
            "SELECT finalized FROM project_texts "
            "WHERE project_id=? AND text_id=?;",
            (project_id, text_id, )
        ).fetchone()['finalized']
    except Exception as e:
          return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot get finalized status'
                                }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                           'message': 'successfully get finalized status.',
                           'isFinalized': isFinalized,
                        }),\
                200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/set_finalized_status', methods=['POST'])
@jwt_required()
def set_finalized_status(project_id, text_id):
    connection = compAnn.model.get_db()
    isFinalized = flask.request.json['isFinalized']
    try:
        connection.execute(
            "UPDATE project_texts SET finalized=? "
            "WHERE project_id=? AND text_id=?;",
            (isFinalized, project_id, text_id, )
        )
    except Exception as e:
          return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot update isFinalized status'
                                }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                          'message': 'successfully update isFinalized status.',
                          'isFinalized': isFinalized,
                        }),\
                200, {'ContentType':'application/json'}
