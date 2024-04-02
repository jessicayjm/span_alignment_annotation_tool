import os
import re

import json
import time
import flask
import pandas as pd
import compAnn
from pathlib import Path
from flask_jwt_extended import jwt_required

@compAnn.app.route('/projects/<int:project_id>/upload_data', methods=['POST'])
@jwt_required()
def upload_data(project_id):
    connection = compAnn.model.get_db()
    files = flask.request.files

    for f in files:
        file = files[f]
        # save to a tmp upload folder
        tmp_filepath = compAnn.app.config['UPLOAD_FOLDER_TMP']/Path(f)
        file.save(tmp_filepath)
        # file loaded correctly
        try:
            df = pd.read_json(tmp_filepath)
        except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot load json file'
                                  }),\
                 500, {'ContentType':'application/json'}
        # file loaded correctly

        # upload the data
        # rtn = pdtd.df_data_to_db(connection, project_id, df)
        # if not json.loads(rtn[0])['ok']:
        #     return rtn

        try:
            # insert texts
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
        except Exception as e:
            # delete the tmp file
            tmp_filepath.unlink()
            return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get text id'
                                    }),\
                    500, {'ContentType':'application/json'}
        try:
            # insert project texts id pairs
            for _, row in df.iterrows():
                connection.execute(
                    "INSERT OR IGNORE INTO project_texts(text_id, project_id, finalized, review_status, "
                    "agreement_pre_review_mean, "
                    "agreement_pre_review_std, "
                    "agreement_post_review_mean, "
                    "agreement_post_review_std) "
                    "VALUES(?, ?, ?, ?, ?, ?, ?, ?);",
                    (row['text_id'], project_id, False, -1, 0, 0, 0, 0,)
                )
        except Exception as e:
            # delete the tmp file
            tmp_filepath.unlink()
            return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot insert project-texts data'
                                    }),\
                    500, {'ContentType':'application/json'}
        try:
            # insert annotations
            r = re.compile("(.+@.+)(?<!_align)$")
            annotators_list = list(filter(r.match, df.columns))
            annotator_id = connection.execute(
                    "SELECT A.email, A.id FROM annotators AS A, project_annotators AS P "
                    "WHERE A.id=P.annotator_id AND P.project_id = ?",
                    (project_id, )
                ).fetchall()
            annotators_dict = {}
            for annotator in annotator_id:
                annotators_dict[annotator['email']] = annotator['id']
        except Exception as e:
            # delete the tmp file
            tmp_filepath.unlink()
            return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get annotators'
                                    }),\
                    500, {'ContentType':'application/json'}
        try:
            label_id = connection.execute(
                "SELECT name, id FROM labels "
                "WHERE project_id=?",
                (project_id, )
                ).fetchall()
            label_dict = {}
            for label in label_id:
                label_dict[label['name']] = label['id']
        except Exception as e:
            # delete the tmp file
            tmp_filepath.unlink()
            return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get labels'
                                    }),\
                    500, {'ContentType':'application/json'}
        try:
            for annotator in annotators_list:
                for _, row in df.iterrows():
                    for ann in row[annotator]:
                        connection.execute(
                                "INSERT OR IGNORE INTO annotations(project_id, text_id, annotator_id, label_id, span_start, span_end, span) "
                                "VALUES(?, ?, ?, ?, ?, ?, ?);",
                                (project_id, row['text_id'], annotators_dict[annotator], label_dict[ann[2]], ann[0], ann[1], ann[3])
                            )
        except Exception as e:
            # delete the tmp file
            tmp_filepath.unlink()
            return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot insert annotations'
                                    }),\
                    500, {'ContentType':'application/json'}
        try:
            # insert alignment annotations
            # get annotation id first
            annotation_dict = {}
            # only finalized spans are used for alignment annotation 
            # so (text_id, span_start, span_end) is unique given project_id
            annotation_ids = connection.execute(
                "SELECT id, text_id, span_start, span_end FROM annotations "
                "WHERE project_id = ? "
                "AND annotator_id = 1", 
                (project_id,)
            ).fetchall()
            for aid in annotation_ids:
                annotation_key = (aid['text_id'], aid['span_start'], aid['span_end'])
                if annotation_key in annotation_dict.keys():
                    # clear the project in db
                    connection.execute("DELETE FROM projects WHERE id=?;", (project_id,))
                    # delete the tmp file
                    tmp_filepath.unlink()
                    return flask.jsonify({'ok':False, 
                                            'message': 'Error: multiple span annotaion key for alignment annotation'
                                            }),\
                            500, {'ContentType':'application/json'}
                annotation_dict[annotation_key] = aid['id']
        except Exception as e:
            # delete the tmp file
            tmp_filepath.unlink()
            return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot get annotation id'
                                    }),\
                    500, {'ContentType':'application/json'}
        try:
            # insert alignment annotations
            for annotator in annotators_list:
                align_col_name = annotator+'_align'
                if align_col_name not in df.columns: continue # for back compatibility
                for _, row in df.iterrows():
                    for ann in row[align_col_name]:
                        connection.execute(
                            "INSERT OR IGNORE INTO alignments(target_ann_id, observer_ann_id, annotator_id) "
                            "VALUES(?,?,?);",
                            (annotation_dict[(row['text_id'], ann[0][0], ann[0][1])],
                            annotation_dict[(row['text_id'], ann[1][0], ann[1][1])],
                            annotators_dict[annotator],)
                        )
        except Exception as e:
            # delete the tmp file
            tmp_filepath.unlink()
            return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot insert alignments'
                                    }),\
                    500, {'ContentType':'application/json'}   
        try:
            savefolder = compAnn.app.config['UPLOAD_FOLDER']/Path("project"+str(project_id))
            # create a folder if not exist
            if not os.path.exists(savefolder):
                os.makedirs(savefolder)
            savepath = savefolder/Path('('+str(time.time())+')'+f)
            file.save(savepath)
            # delete the tmp file
            tmp_filepath.unlink()
        except Exception as e:
                # delete the tmp file
                tmp_filepath.unlink()
                return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot save local copy'
                                    }),\
                    500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 'message': 'success'}), 200, {'ContentType':'application/json'} 