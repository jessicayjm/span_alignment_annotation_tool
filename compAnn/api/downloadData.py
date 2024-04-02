import flask
import json
import compAnn
import numpy as np
import pandas as pd
from flask_jwt_extended import jwt_required

@compAnn.app.route('/projects/<int:project_id>/download_data', methods=['GET'])
@jwt_required()
def download_data(project_id):
    connection = compAnn.model.get_db()
    try:
        # get project info
        output = connection.execute(
            "SELECT name, description, agreement_score FROM projects "
            "WHERE id = ?",
            (project_id,)
        ).fetchone()
    except Exception as e:
        return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get project info'
                                    }),\
                    500, {'ContentType':'application/json'}
    
    try:
        # get text info
        # text_info = connection.execute(
        #     "SELECT T.id, T.target_id, T.observer_id, T.parent_id, "
        #     "T.subreddit, T.target_text, T.observer_text, T.full_text, "
        #     "T.distress_score, T.condolence_score, T.empathy_score, T.agreement_score "
        #     "FROM texts AS T, project_texts AS P "
        #     "WHERE P.project_id=? AND P.text_id=T.id;",
        #     (project_id,)
        # ).fetchall()
        text_info = connection.execute(
            "SELECT T.*, P.finalized, P.review_status, P.agreement_pre_review_mean, "
            "P.agreement_pre_review_std, P.agreement_post_review_mean, "
            "P.agreement_post_review_std "
            "FROM texts AS T, project_texts AS P "
            "WHERE P.project_id=? AND P.text_id=T.id "
            "ORDER BY T.id ASC;",
            (project_id,)
        ).fetchall()
        data = pd.DataFrame(text_info)
    except Exception as e:
        return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get text info'
                                    }),\
                    500, {'ContentType':'application/json'}
    
    try:
        # get label info
        label_info_raw = connection.execute(
            "SELECT id, name, color FROM labels "
            "WHERE project_id = ?",
            (project_id,)
        ).fetchall()
        # add label metadata to output (name, color)
        label_df = pd.DataFrame(label_info_raw)
        label_df = label_df[['name', 'color']]
        output['labels'] = json.loads(label_df.to_json(orient = "records"))
        # reformat to dict {id: name}
        label_info = {}
        for label in label_info_raw:
            label_info[label['id']] = label['name']
    except Exception as e:
        return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get label info'
                                    }),\
                    500, {'ContentType':'application/json'}

    try:
        # get annotators info
        annotator_info = connection.execute(
            "SELECT A.id, A.fullname, username, email, P.isAdmin FROM annotators AS A, project_annotators AS P "
            "WHERE A.id = P.annotator_id AND P.project_id = ?",
            (project_id,)
        ).fetchall()
        annotator_df = pd.DataFrame(annotator_info)
        # add annotator metadata to output (fullname, username, email)
        annotator_meta = annotator_df[['fullname', 'username', 'email', 'isAdmin']]
        output['annotators'] = json.loads(annotator_meta.to_json(orient = "records"))
    except Exception as e:
        return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get annotators info'
                                    }),\
                    500, {'ContentType':'application/json'}
    try:
        # get annotations
        data['annotations'] = np.empty((len(data), 0)).tolist()
        data['alignments'] = np.empty((len(data), 0)).tolist()
        for annotator in annotator_info:
            annotation_raw = connection.execute(
                "SELECT text_id, label_id, span_start, span_end, span "
                "FROM annotations "
                "WHERE project_id= ? "
                "AND annotator_id = ?",
                (project_id, annotator['id'],)
            ).fetchall()
            alignment_raw = connection.execute(
                "SELECT T.text_id AS text_id, "
                "T.span_start AS target_start, T.span_end AS target_end, T.span AS target_span, "
                "O.span_start AS observer_start, O.span_end AS observer_end, O.span AS observer_span "
                "FROM alignments AS AL, annotations AS T, annotations AS O "
                "WHERE T.project_id = ? "
                "AND AL.annotator_id = ? "
                "AND AL.target_ann_id = T.id "
                "AND AL.observer_ann_id = O.id ",
                (project_id, annotator['id'],)
            ).fetchall()
            # reformat
            # id | text | annotations | annotator1 | annotator2 | ... | alignments | annotator1_align | annotator2_align | ... |
            # -----------------------
            # id : id of the text in db
            # text: the raw text
            # annotations: array of annotations, each with the format of [email, start, end, label]
            # annotator?: [start, end, label]
            # alignemnts: array of alignments, each with the format ogf [email, (target_start, target_end), (observer_start, observer_end)]
            # annotator?_align: [(target_start, target_end), (observer_start, observer_end)]
            annotation = pd.DataFrame(annotation_raw)
            alignment = pd.DataFrame(alignment_raw)
            if len(annotation) > 0:
                annotation[annotator['email']] = annotation.apply(
                    lambda x: [x['span_start'], x['span_end'], label_info[x['label_id']], x['span']] \
                        if x['span_start'] else [],
                    axis = 1
                )
                annotation = annotation[['text_id', annotator['email']]]
                annotation = annotation.groupby(['text_id']).agg({
                    annotator['email']: lambda x: list(x),
                }).reset_index()
                data = data.merge(annotation, left_on='id', right_on='text_id', how='left')
                data = data.loc[:, data.columns!="text_id"]
                data[annotator['email']] = data[annotator['email']].fillna('').apply(list)
                data['tmp'] = data[annotator['email']].apply(
                    lambda x: [[annotator['email']]+ann for ann in x]
                )
                data['annotations'] += data['tmp']
            if len(alignment) > 0:
                
                align_col_name = annotator['email']+'_align'
                alignment[align_col_name] = alignment.apply(
                    lambda x: [(x['target_start'], x['target_end'], x['target_span']), \
                               (x['observer_start'], x['observer_end'], x['observer_span'])] \
                        if x['target_start'] else [],
                    axis = 1
                ) 
                alignment = alignment[['text_id', align_col_name]]
                alignment = alignment.groupby(['text_id']).agg({
                    align_col_name: lambda x: list(x),
                }).reset_index()
                data = data.merge(alignment, left_on='id', right_on='text_id', how='left')
                data = data.loc[:, data.columns!="text_id"]
                data[align_col_name] = data[align_col_name].fillna('').apply(list)
                data['tmp'] = data[align_col_name].apply(
                    lambda x: [[align_col_name]+ann for ann in x]
                )
                data['alignments'] += data['tmp']
        # cols_filter = ['id', 'full_text', 'annotations'] + \
        #     [ann for ann in data.columns if ann in list(annotator_df['email'])]
        # data = data[cols_filter]
        data = data.filter(regex='^((?!text_id).)*$', axis=1)
        data = data.loc[:, data.columns != 'tmp']
        data = json.loads(data.to_json())
        output['data'] = data
    except Exception as e:
        return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get annotations'
                                    }),\
                    500, {'ContentType':'application/json'}
    return flask.jsonify(output),\
                    200, {'ContentType':'application/json'}