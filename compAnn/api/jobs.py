from time import strftime
from datetime import datetime

import os
import flask
import compAnn
import numpy as np
import pandas as pd
from pathlib import Path
from flask_jwt_extended import jwt_required, get_jwt_identity

action_type_list = ['annotate spans', 'annotate alignment', 'review spans', 'review alignment']
action_type_dict = {
    'annotate spans': 0,
    'annotate alignment': 1, 
    'review spans': 2,
    'review alignment': 3
}
month_num_dict = {
    'Jan': '01',
    'Feb': '02',
    'Mar': '03',
    'Apr': '04',
    'May': '05',
    'Jun': '06',
    'Jul': '07',
    'Aug': '08',
    'Sep': '09',
    'Oct': '10',
    'Nov': '11',
    'Dec': '12'
}

# check if the page is valid to be rendered: past due, random url access
@compAnn.app.route('/jobs/<int:project_id>/text-<int:text_id>/check_valid_rendering', methods=['POST'])
@jwt_required()
def check_valid_rendering(project_id, text_id):
    is_admin = flask.request.json['is_admin']
    if is_admin:
        return flask.jsonify({'ok':True, 
                                'message': 'Allow to render'
                                }),\
                200, {'ContentType':'application/json'}
    connection = compAnn.model.get_db()

    action_type = action_type_dict[flask.request.json['action_type']]

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
    # find the job_id and due time
    job_info = connection.execute(
        "SELECT J.id, J.due_time "
        "FROM jobs AS J, job_actions AS JA "
        "WHERE JA.project_id=? "
        "AND JA.text_id=? "
        "AND JA.annotator_id=? "
        "AND JA.action_type=? "
        "AND JA.job_id = J.id;",
        (project_id, text_id, annotator_id, action_type )
    ).fetchall()
    if len(job_info) == 0 and action_type != 2:
        return flask.jsonify({'ok':False, 
                                'message': 'Error: Bad request. You are not allowed to enter this page'
                                }),\
                400, {'ContentType':'application/json'}
    elif len(job_info) == 1:
        # if past the due time, not allowed to enter the page
        current_time = strftime("%Y-%m-%d %H:%M:%S")
        if current_time > job_info[0]['due_time']:
            return flask.jsonify({'ok':False, 
                                'message': 'Error: Bad request. Past due.'
                                }),\
                400, {'ContentType':'application/json'}
        else:
            return flask.jsonify({'ok':True, 
                                'message': 'Allow to render'
                                }),\
                200, {'ContentType':'application/json'}
    else: 
        return flask.jsonify({'ok':False, 
                            'message': 'Error: db constraint failed. One text belongs to multiple jobs.'
                            }),\
            500, {'ContentType':'application/json'}


def get_link(row):
    # current_time = datetime.datetime.utcnow().isoformat()
    current_time = strftime("%Y-%m-%d %H:%M:%S")
    if not row['isActive'] or current_time > row['due_time']: # the job is inactive or past due
        return ''
    
    if row['action_type'] == 0:
        return f"/annotate/spans/project-{row['project_id']}"
    elif row['action_type'] == 1:
        return f"/annotate/alignment/project-{row['project_id']}"
    elif row['action_type'] == 2:
        return f"/review/spans/project-{row['project_id']}"
    else:
        return f"/review/alignment/project-{row['project_id']}"


def get_my_job_status(row):
    current_time = strftime("%Y-%m-%d %H:%M:%S")
    if not row['isActive']: return 0
    if row['finished'] == row['total_texts']: return 2
    if current_time <= row['due_time']: return 1
    else: return 3

@compAnn.app.route('/jobs/get_my_jobs', methods=['GET'])
@jwt_required()
def get_my_jobs():
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
        jobs = connection.execute(
            "SELECT P.id AS project_id, P.name AS project_name, JA.action_type, JA.finished, JA.total_texts, "
            "J.name AS job_name, J.isActive, J.due_time "
            "FROM (SELECT project_id, job_id, action_type, "
            "SUM(IIF(status = 2, 1, 0)) AS finished, COUNT(text_id) AS total_texts "
            "FROM job_actions "
            "WHERE annotator_id = ? AND job_id != 0 "
            "GROUP BY project_id, job_id, action_type) AS JA, "
            "projects AS P, jobs AS J "
            "WHERE P.id = JA.project_id "
            "AND J.id = JA.job_id "
            "ORDER BY J.due_time ASC, JA.finished/JA.total_texts ASC;",
            (annotator_id, )
        ).fetchall()
        if len(jobs) != 0:
            jobs = pd.DataFrame(jobs)
            jobs['progress'] = (jobs['finished']*100 / jobs['total_texts']).astype('int').astype(str)+'%'
            jobs['status'] = jobs.apply(get_my_job_status, axis = 1)
            jobs['link'] = jobs.apply(get_link, axis=1)
            jobs['action_type'] = jobs['action_type'].apply(lambda x: action_type_list[x])
            jobs['display_id'] = pd.Series(range(1,len(jobs)+1))
            jobs = jobs.loc[:, ~jobs.columns.isin(['project_id'])]
            jobs = jobs.to_dict('records')
        else: jobs = []
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot get jobs'
                                }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                        'jobs': jobs,
                        'message': 'successfully get my jobs'
                    }),\
        200, {'ContentType':'application/json'}


@compAnn.app.route('/jobs/get_my_individual_job_info/<int:project_id>/text-<int:text_id>', methods=['POST'])
@jwt_required()
def get_my_individual_job_info(project_id, text_id):
    connection = compAnn.model.get_db()
    action_type = action_type_dict[flask.request.json['action_type']]
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

    job_info = connection.execute(
        "SELECT J.id, J.name, J.due_time, J.isActive, JA.status "
        "FROM jobs AS J, job_actions AS JA "
        "WHERE JA.project_id=? "
        "AND JA.text_id=? "
        "AND JA.annotator_id=? "
        "AND JA.action_type=? "
        "AND JA.job_id = J.id;",
        (project_id, text_id, annotator_id, action_type )
    ).fetchall()
    if len(job_info) == 0:
        # no job is created for the current text, can only happen in review task
        # check if action_type is review
        if action_type != 2 or action_type != 3:
            return flask.jsonify({'ok':False, 
                            'message': 'Error: no annotation job created for this text.'
                            }),\
            500, {'ContentType':'application/json'}
        else:
            return flask.jsonify({'ok':True, 
                            'message': 'successfully get job info',
                            'job_info': {
                                'job_id': -1,
                                'isActiveJob': False, # no job header line should be shown here
                                'status': -1,
                            }
                }),\
            200, {'ContentType':'application/json'}
    elif len(job_info) == 1:
        job_id = job_info[0]['id']
        job_name = job_info[0]['name']
        due_time = job_info[0]['due_time']
        isActive = job_info[0]['isActive']
        status = job_info[0]['status']
        # no job is created for the current text, can only happen in review task
        # job_id = 0 means no job created, annotator did extra work
        if job_id == 0 and action_type!=2 and action_type!=3:
            return flask.jsonify({'ok':False, 
                            'message': 'Error: no annotation job created for this text.'
                            }),\
            500, {'ContentType':'application/json'}
        if job_id == 0:
            return flask.jsonify({'ok':True, 
                            'message': 'successfully get job info',
                            'job_info': {
                                'job_id': 0,
                                'isActiveJob': False, # no job header line should be shown here
                                'status': status,
                            }     
                }),\
            200, {'ContentType':'application/json'}
        # garuanteed active job here
        # get statistics on this job
        job_info_stats = connection.execute(
            "SELECT SUM(IIF(status = 2, 1, 0)) AS finished, "
            "SUM(IIF(status = 1, 1, 0)) AS pending, "
            "COUNT(text_id) AS total_texts "
            "FROM job_actions "
            "WHERE annotator_id = ? AND job_id = ? AND action_type = ? AND project_id = ? "
            "GROUP BY annotator_id, job_id, action_type, project_id;",
            (annotator_id, job_id, action_type, project_id,)
        ).fetchone()
        return flask.jsonify({'ok':True, 
                            'message': 'successfully get job info',
                            'job_info': {
                                'job_id': job_id,
                                'job_name': job_name,
                                'due_time': due_time,
                                'isActiveJob': isActive,
                                'finished': job_info_stats['finished'],
                                'pending': job_info_stats['pending'],
                                'total_texts': job_info_stats['total_texts'],
                                'process': str(int((job_info_stats['finished']*100 / job_info_stats['total_texts'])))+'%',
                                'status': status}
                            }),\
            200, {'ContentType':'application/json'}
    else:
        return flask.jsonify({'ok':False, 
                            'message': 'Error: db constraint failed. One text belongs to multiple jobs.'
                            }),\
            500, {'ContentType':'application/json'}


def get_annotator_progress(row, connection):
    annotator_progress = connection.execute(
            "SELECT A.username, A.email, SUM(IIF(JA.status = 2, 1, 0)) AS finished, "
            "COUNT(JA.text_id) AS total_texts "
            "FROM job_actions AS JA, annotators AS A "
            "WHERE job_id = ? AND JA.annotator_id = A.id "
            "GROUP BY JA.annotator_id "
            "ORDER BY JA.annotator_id;",
            (row['id'], )
        ).fetchall()
    annotator_progress = pd.DataFrame(annotator_progress)
    annotator_progress['progress'] = (annotator_progress['finished']*100 / annotator_progress['total_texts'])\
                                        .astype('int').astype(str)+'%'
    annotator_progress['display_id'] = pd.Series(range(1,len(annotator_progress)+1)) 
    annotator_progress = annotator_progress.to_dict('records')
    return annotator_progress

def get_main_status(row):
    current_time = strftime("%Y-%m-%d %H:%M:%S")
    if not row['isActive']: return 0
    if row['finished'] == row['total_texts']: return 2
    if current_time <= row['due_time']: return 1
    else: return 3


@compAnn.app.route('/jobs/get_manage_jobs', methods=['GET'])
@jwt_required()
def get_manage_jobs():
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

    # get: job_name, project_name, action_type, start_time, due_time, num_texts, progress_bar, status
    try:
        jobs = connection.execute(
            "SELECT P.id AS project_id, P.name AS project_name, JA.action_type, JA.total_texts, "
            "JA.distinct_texts, JA.finished, JA.num_annotators, J.name AS job_name, "
            "J.isActive, J.start_time, J.due_time, J.id "
            "FROM (SELECT JA_.project_id, JA_.job_id, JA_.action_type, "
            "SUM(IIF(status = 2, 1, 0)) AS finished, "
            "COUNT(DISTINCT JA_.text_id) AS distinct_texts, "
            "COUNT(JA_.text_id) AS total_texts, "
            "COUNT(DISTINCT JA_.annotator_id) AS num_annotators "
            "FROM job_actions AS JA_, project_annotators AS PA "
            "WHERE PA.annotator_id = ? "
            "AND PA.isAdmin = 1 "
            "AND PA.project_id = JA_.project_id "
            "AND JA_.job_id != 0 "
            "GROUP BY JA_.project_id, JA_.job_id, JA_.action_type) AS JA, "
            "projects AS P, jobs AS J "
            "WHERE P.id = JA.project_id "
            "AND J.id = JA.job_id "
            "ORDER BY J.isActive DESC, J.due_time ASC;",
            (annotator_id, )
        ).fetchall()
        if len(jobs) != 0:
            jobs = pd.DataFrame(jobs)
            jobs['progress'] = (jobs['finished']*100 / jobs['total_texts']).astype('int').astype(str)+'%'
            jobs['action_type'] = jobs['action_type'].apply(lambda x: action_type_list[x])
            jobs['annotator_progress'] = jobs.apply(get_annotator_progress, connection=connection, axis=1)
            jobs['main_status'] = jobs.apply(get_main_status, axis=1)
            jobs = jobs.to_dict('records')
        else:
            jobs = []
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot get jobs'
                                }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                        'jobs': jobs,
                        'message': 'successfully get manage jobs'
                    }),\
        200, {'ContentType':'application/json'}


@compAnn.app.route('/jobs/check_job_name', methods=['POST'])
@jwt_required()
def check_job_name():
    job_name = flask.request.json['job_name']
    project_id = flask.request.json['project_id']
    connection = compAnn.model.get_db()
    try:
        exist = connection.execute(
            "SELECT EXISTS(SELECT 1 FROM jobs "
            "WHERE name = ?) AS exist",
            (job_name, )
        ).fetchone()['exist']
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot search for job names'
                                }),\
                500, {'ContentType':'application/json'}
    
    annotators = []
    if not exist:
        try:
            annotators = connection.execute(
                "SELECT A.id, A.username, A.email FROM annotators AS A, project_annotators AS PA "
                "WHERE PA.project_id = ? AND PA.annotator_id != 1 AND PA.annotator_id = A.id "
                "ORDER BY A.id;",
                (project_id, )
            ).fetchall()
        except Exception as e:
            return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot get annotators'
                                }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                        'valid': not exist,
                        'annotators': annotators,
                        'message': 'successfully validate job name'
                    }),\
        200, {'ContentType':'application/json'}


@compAnn.app.route('/jobs/create_jobs', methods=['POST'])
@jwt_required()
def create_jobs():
    job_name = flask.request.form['job_name']
    project_id = flask.request.form['project_id']
    action_type = action_type_dict[flask.request.form['action_type']]
    due_time = flask.request.form['due_time']
    annotator_ids = flask.request.form['annotator_ids'].split(' ')
    annotator_ids.pop() # exclude '' at the end
    annotator_ids = [int(ann_id) for ann_id in annotator_ids]
    files = flask.request.files
    print(files)

    due_time = due_time.split(' ')[1:5]
    due_time =due_time[2] + '-' + month_num_dict[due_time[0]] + '-' + due_time[1] + ' ' + due_time[3]

    connection = compAnn.model.get_db()
    # insert the job
    try:
        connection.execute(
            "INSERT INTO jobs(name, due_time, isActive) "
            "VALUES(?, ?, 1);",
            (job_name, due_time,)
        )
        job_id = connection.execute(
            "SELECT id FROM jobs WHERE name=?;",(job_name,)
        ).fetchone()['id']
    except Exception as e:
        return flask.jsonify({'ok':False, 
                            'message': 'Error: cannot insert job info'
                            }),\
            500, {'ContentType':'application/json'}

    # insert individual job entry
    # for each text specified in the file array, insert into the project
    # assign text_id to individual jobs
    # keep the status if the annotator has pre-finished the job

    # insert review and annotate alignment job
    if action_type == 1 or action_type == 2 or action_type == 3:
        for annotator_id in annotator_ids:
            if action_type == 1:
                text_ids = connection.execute(
                    "SELECT DISTINCT(text_id) FROM project_texts "
                    "WHERE project_id = ? AND finalized = 1;",
                    (project_id,)
                ).fetchall()
            else:
                text_ids = connection.execute(
                    "SELECT DISTINCT(text_id) FROM annotations "
                    "WHERE project_id = ? AND annotator_id = ?;",
                    (project_id, annotator_id,)
                ).fetchall()
            if len(text_ids) !=0:
                text_ids = pd.DataFrame(text_ids)
                for text_id in text_ids['text_id']:

                    # update job id if is created
                    has_entry = connection.execute(
                        "SELECT EXISTS(SELECT 1 FROM job_actions "
                        "WHERE project_id = ? AND text_id=? AND annotator_id=? AND action_type=?) AS exist;",
                        (project_id, text_id, annotator_id, action_type,)
                    ).fetchone()['exist']
                    if has_entry:
                        connection.execute(
                            "UPDATE job_actions SET job_id=? "
                            "WHERE project_id = ? AND text_id=? AND annotator_id=? AND action_type=?;",
                            (job_id, project_id, text_id, annotator_id, action_type,)
                        )
                    else:
                        # insert into the job_actions table
                        connection.execute(
                            "INSERT OR IGNORE INTO job_actions(project_id, text_id, annotator_id, job_id, action_type, status) "
                            "VALUES(?,?,?,?,?,?);",
                            (project_id, text_id, annotator_id, job_id, action_type, 0)
                        )
    else: # insert assign span job
        print(len(files))
        for annotator_id in files:
            _file = files.getlist(annotator_id)
            annotator_id = int(annotator_id)
            for file in _file:
                print(file)
                
                print(annotator_id)
                # save to a tmp upload folder
                tmp_filepath = compAnn.app.config['UPLOAD_FOLDER_TMP']/'tmp.csv'
                file.save(tmp_filepath)
                try:
                    df = pd.read_csv(tmp_filepath)
                    df = df.rename(columns={"id_target": "target_id", "id_observer": "observer_id",
                            "target":"target_text", "observer":"observer_text", "text":"full_text"})
                except Exception as e:
                    return flask.jsonify({'ok':False, 
                                        'message': 'Error: cannot load project json file'
                                        }),\
                        500, {'ContentType':'application/json'}
                # insert texts
                try:
                    for _, row in df.iterrows():
                        connection.execute(
                            "INSERT OR IGNORE INTO texts("
                            "target_id, "
                            "observer_id, "
                            "parent_id, "
                            "subreddit, "
                            "target_text, "
                            "observer_text, "
                            "full_text, "
                            "distress_score, "
                            "condolence_score, "
                            "empathy_score) "
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            (
                                row.target_id,
                                row.observer_id,
                                row.parent_id,
                                row.subreddit,
                                row.target_text,
                                row.observer_text,
                                row.full_text,
                                row.distress_score,
                                row.condolence_score,
                                row.empathy_score,
                            )
                        )
                    print('finish inserting texts')
                except Exception as e:
                    # delete the tmp file
                    tmp_filepath.unlink()
                    return flask.jsonify({'ok':False, 
                                            'message': 'Error: cannot insert text data'
                                            }),\
                            500, {'ContentType':'application/json'}
                try:
                    # update text id
                    text_ids = connection.execute(
                        "SELECT id, full_text FROM texts"
                    ).fetchall()
                    texts_df = pd.DataFrame(text_ids, columns=['id', 'full_text'])
                    texts_df.rename(columns={"id": "text_id"}, inplace=True)
                    df = df.merge(texts_df, how='left', on='full_text')
                    print('finish updating ids')
                except Exception as e:
                    # delete the tmp file
                    tmp_filepath.unlink()
                    return flask.jsonify({'ok':False, 
                                            'message': 'Error: cannot get text id'
                                            }),\
                            500, {'ContentType':'application/json'}
                try:
                    # insert project texts id pairs
                    # insert job_actions
                    for text_id in df['text_id']:
                        connection.execute(
                            "INSERT OR IGNORE INTO project_texts(text_id, project_id, finalized, review_status, "
                            "agreement_pre_review_mean, "
                            "agreement_pre_review_std, "
                            "agreement_post_review_mean, "
                            "agreement_post_review_std) "
                            "VALUES(?, ?, ?, ?, ?, ?, ?, ?);",
                            (text_id, project_id, False, -1, 0, 0, 0, 0,)
                        )

                        # update job id if is created
                        has_entry = connection.execute(
                            "SELECT EXISTS(SELECT 1 FROM job_actions "
                            "WHERE project_id = ? AND text_id=? AND annotator_id=? AND action_type=?) AS exist;",
                            (project_id, text_id, annotator_id, action_type,)
                        ).fetchone()['exist']
                        if has_entry:
                            connection.execute(
                                "UPDATE job_actions SET job_id=? "
                                "WHERE project_id = ? AND text_id=? AND annotator_id=? AND action_type=?;",
                                (job_id, project_id, text_id, annotator_id, action_type,)
                            )
                        else:
                            # insert into the job_action table
                            connection.execute(
                                "INSERT OR IGNORE INTO job_actions(project_id, text_id, annotator_id, job_id, action_type, status) "
                                "VALUES(?,?,?,?,?,?);",
                                (project_id, text_id, annotator_id, job_id, action_type, 0)
                            )
                    print('finish inserting pairs')
                except Exception as e:
                    # delete the tmp file
                    tmp_filepath.unlink()
                    return flask.jsonify({'ok':False, 
                                            'message': 'Error: cannot insert project-texts data'
                                            }),\
                            500, {'ContentType':'application/json'}
                # save a local copy of the uploaded datafile
                try:
                    savefolder = compAnn.app.config['UPLOAD_FOLDER']/Path("project"+str(project_id))
                    # create a folder if not exist
                    if not os.path.exists(savefolder):
                        os.makedirs(savefolder)
                    datetime_str = datetime.now().strftime("%Y-%m-%d_%H:%M:%S")
                    savepath = savefolder/Path('('+datetime_str+')'+str(annotator_id)+'.csv')
                    file.save(savepath)
                    # delete the tmp file
                    tmp_filepath.unlink()
                    print('finish save local copies')
                except Exception as e:
                    # clear the project in db
                    connection.execute("DELETE FROM projects WHERE id=?;", (project_id,))
                    # delete the tmp file
                    tmp_filepath.unlink()
                    return flask.jsonify({'ok':False, 
                                        'message': 'Error: cannot save local copy'
                                        }),\
                        500, {'ContentType':'application/json'}

    return flask.jsonify({'ok':True, 
                        'message': 'successfully create jobs'
                    }),\
        200, {'ContentType':'application/json'}


@compAnn.app.route('/jobs/<int:project_id>/text-<int:text_id>/update_job_status', methods=['POST'])
@jwt_required()
def update_job_status(project_id, text_id):
    connection = compAnn.model.get_db()

    action_type = action_type_dict[flask.request.json['action_type']]
    update_status = flask.request.json['update_status']

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
            "UPDATE job_actions SET status=? "
            "WHERE project_id=? AND text_id=? AND annotator_id=? AND action_type=?;",
            (update_status, project_id, text_id, annotator_id, action_type,)
        )
    except Exception as e:
        return flask.jsonify({'ok':False, 
                            'message': 'Error: cannot get annotator id'
                            }),\
            500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                        'message': 'successfully update status',
                        'new_status': update_status,
                    }),\
        200, {'ContentType':'application/json'}

@compAnn.app.route('/jobs/<int:project_id>/text-<int:text_id>/check_review_spans_job', methods=['GET'])
@jwt_required()
def check_review_spans_job(project_id, text_id):
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
        hasJob = connection.execute(
            "SELECT EXISTS (SELECT 1 FROM job_actions "
            "WHERE project_id=? AND text_id=? "
            "AND annotator_id=? AND action_type=2) AS hasJob",
            (project_id, text_id, annotator_id, )
        ).fetchone()['hasJob']
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get user info on text'
                                  }),\
                 500, {'ContentType':'application/json'}
    
    context = {
        "userHasJob": hasJob,
        "user_id": annotator_id,
    }
    return flask.jsonify(**context)