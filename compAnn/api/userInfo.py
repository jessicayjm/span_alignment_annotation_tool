import flask
import compAnn
import pandas as pd
from flask_jwt_extended import jwt_required, get_jwt_identity

@compAnn.app.route('/userinfo', methods=['GET'])
@jwt_required()
def user_info():
    connection = compAnn.model.get_db()

    try:
      email = get_jwt_identity()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: invalid token'
                                  }),\
                 400, {'ContentType':'application/json'}
    try:
      user_info = connection.execute(
        "SELECT id, username, fullname, email FROM annotators "
        "WHERE email = ?;",
        (email, )
    ).fetchone()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get user info'
                                  }),\
                 500, {'ContentType':'application/json'}
    
    return flask.jsonify({'ok':True, 
                          'message': 'successfully get user info',
                          'user': user_info,
                        }),\
                        200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/verifypermission', methods=['GET'])
@jwt_required()
def verify_permission(project_id):
    try:
      email = get_jwt_identity()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: invalid token'
                                  }),\
                 400, {'ContentType':'application/json'}
    connection = compAnn.model.get_db()
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
                                  'message': 'Error: cannot get admin info'
                                  }),\
                 500, {'ContentType':'application/json'}
    
    return flask.jsonify({'ok':True, 
                          'message': 'successfully get admin info',
                          'isAdmin': is_admin['isAdmin'],
                        }),\
                        200, {'ContentType':'application/json'}
