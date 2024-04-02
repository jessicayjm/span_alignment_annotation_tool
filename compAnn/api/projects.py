import pandas as pd
import flask
import compAnn
from flask_jwt_extended import jwt_required, get_jwt_identity

action_type_list = ['annotate spans', 'annotate alignment', 'review spans', 'review alignment']
action_type_dict = {
    'annotate spans': 0,
    'annotate alignment': 1, 
    'review spans': 2,
    'review alignment': 3
}

@compAnn.app.route('/projects-lists/', methods=['GET'])
@jwt_required()
def get_projects():
    connection = compAnn.model.get_db()
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
        # need to exclude projects that are assigned for annotations
        has_ann_job_proj_ids = connection.execute(
          "SELECT JA.project_id "
          "FROM (SELECT project_id, "
          "SUM(IIF(status = 2, 1, 0)) AS finished, COUNT(text_id) AS total_texts "
          "FROM job_actions "
          "WHERE annotator_id = ? AND job_id != 0 AND action_type IN (0, 1) "
          "GROUP BY project_id, job_id, action_type) AS JA "
          "WHERE JA.finished < JA.total_texts;",
          (annotator_id,)
        ).fetchall()
        if len(has_ann_job_proj_ids) != 0:
          has_ann_job_proj_ids = [i['project_id'] for i in has_ann_job_proj_ids]
        project_list = connection.execute(
            "SELECT P.id, P.name, P.description "
            "FROM projects AS P, project_annotators AS PA, annotators AS A "
            "WHERE A.email=? "
            "AND A.id=PA.annotator_id "
            "AND PA.project_id = P.id "
            "ORDER BY P.id ASC;",
            (email,)
        ).fetchall()
        project_list = [p for p in project_list if p['id'] not in has_ann_job_proj_ids]
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get project list'
                                  }),\
                 500, {'ContentType':'application/json'}    
    return flask.jsonify({'ok':True, 
                                  'message': 'successfully get project list',
                                  'projects': project_list,
                                  }),\
                 200, {'ContentType':'application/json'}    


@compAnn.app.route('/user_projects', methods=['GET'])
@jwt_required()
def user_projects():
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
    try:
        projects = connection.execute(
          "SELECT P.id, P.name FROM projects AS P, project_annotators AS PA "
          "WHERE PA.annotator_id = ? "
          "AND PA.isAdmin = 1 "
          "AND PA.project_id = P.id "
          "ORDER BY P.id ASC;",
          (annotator_id, )
        ).fetchall()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get user owned projects'
                                  }),\
                 500, {'ContentType':'application/json'}

    return flask.jsonify({'ok':True, 
                          "projects": projects,
                          'message': 'successfully get user projects.',
                          }),\
          200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/annotators', methods=['GET'])
@jwt_required()
def project_annotators(project_id):
    connection = compAnn.model.get_db()

    try:
      annotators = connection.execute(
        "SELECT A.id, A.username, A.email FROM annotators AS A, project_annotators AS PA "
        "WHERE PA.project_id = ? AND PA.annotator_id != 1 AND PA.annotator_id = A.id "
        "ORDER BY A.id;",
        (project_id, )
    ).fetchall()
    except Exception as e:
            return flareviewsk.jsonify({'ok':False, 
                                  'message': 'Error: cannot get annotators'
                                  }),\
                 500, {'ContentType':'application/json'}

    return flask.jsonify({'ok':True, 
                          "annotators": annotators,
                          'message': 'successfully get annotators.',
                          }),\
          200, {'ContentType':'application/json'}

@compAnn.app.route('/jobs/projects-lists/', methods=['POST'])
@jwt_required()
def get_annotate_projects():
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
    
    # get the projects that the annotator are assigned to annotate
    try:
        projects = connection.execute(
          "SELECT DISTINCT(P.id), P.name "
          "FROM projects AS P, job_actions AS JA "
          "WHERE JA.annotator_id = ? "
          "AND JA.job_id != 0 "
          "AND JA.action_type = ? "
          "AND JA.project_id = P.id "
          "ORDER BY P.id ASC;",
          (annotator_id, action_type,)
        ).fetchall()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get project list to annotate'
                                  }),\
                 500, {'ContentType':'application/json'}

    return flask.jsonify({'ok':True, 
                          "projects": projects,
                          'message': 'successfully get annotate projects.',
                          }),\
          200, {'ContentType':'application/json'}
