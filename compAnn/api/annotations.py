import flask
import compAnn
import pandas as pd
from flask_jwt_extended import jwt_required, get_jwt_identity

# get the span annotations for a specific annotator
@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotations', methods=['GET'])
@jwt_required()
def get_anns(project_id, text_id):
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
        annotations = connection.execute(
            "SELECT A.span_start AS start, A.span_end AS end, A.span AS text, "
            "L.name AS tag, L.color AS color, L.id AS tag_id "
            "FROM annotations AS A, labels AS L "
            "WHERE A.text_id = ? "
            "AND A.project_id = ? "
            "AND A.annotator_id = ? "
            "AND L.id = A.label_id;",
            (text_id, project_id, annotator_id,)
        ).fetchall()
    except Exception as e:
      return e
    return flask.jsonify({'ok':True, 
                        'annotations': annotations,
                        'message': 'successfully get my annotations'
                    }),\
        200, {'ContentType':'application/json'}


# get the final span annotations to show in the alignment annotation page
@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotations/align-annotation', methods=['GET'])
@jwt_required()
def get_alignments(project_id, text_id):
    connection = compAnn.model.get_db()
    try:
        target_prefix = 'target:\n\n'
        observer_prefix = '\n\n' # 'observer:\n\n' should be shown in the text
        texts = connection.execute(
            "SELECT target_text, observer_text "
            "FROM texts "
            "WHERE id = ?;",
            (text_id,)
        ).fetchone()
        target_text = target_prefix + texts['target_text']
        observer_text = 'observer:\n\n' + texts['observer_text']
        observer_pre_len = len(target_text)+len(observer_prefix)
        annotations = connection.execute(
            "SELECT A.id, A.span_start AS start, A.span_end AS end, "
            "L.name AS tag, L.color AS color, L.id AS tag_id "
            "FROM annotations AS A, labels AS L "
            "WHERE A.text_id = ? "
            "AND A.project_id = ? "
            "AND A.annotator_id = 1 " # alignment annotation is based on the final annotations
            "AND L.id = A.label_id;",
            (text_id, project_id,)
        ).fetchall()
    except Exception as e:
      return e
    # format data to separate target and observer 
    try:
        target_annotations = []
        observer_annotations = []
        for ann in annotations:
            if ann['end'] <= observer_pre_len: # target annotation
                target_annotations.append(ann)
            else: # observer annotation
                ann_tmp = ann
                ann_tmp['start'] -= observer_pre_len
                ann_tmp['end'] -= observer_pre_len
                observer_annotations.append(ann_tmp)
        target_annotations = sorted(target_annotations, key=lambda d: d['start']) 
        observer_annotations = sorted(observer_annotations, key=lambda  d: d['start'])
    except Exception as e:
      return e

    return flask.jsonify({'ok':True, 
                        'target_text': target_text,
                        'target_annotations': target_annotations,
                        'observer_text': observer_text,
                        'observer_annotations': observer_annotations,
                        'message': 'successfully get my annotations'
                    }),\
        200, {'ContentType':'application/json'}


# get the alignment annotations of a specific annotator
@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotations/alignments', methods=['POST'])
@jwt_required()
def get_anns_align(project_id, text_id):
    connection = compAnn.model.get_db()
    is_admin = flask.request.json['isAdmin']
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
        alignments = {}
        alignments_list = connection.execute(
            "SELECT DISTINCT(A.id), A1.span AS target_span, A2.span AS observer_span, "
            "L1.name AS target_label, L1.color AS target_color, "
            "L2.name AS observer_label, L2.color AS observer_color "
            "FROM alignments AS A, annotations AS A1, annotations AS A2, labels AS L1, labels AS L2 "
            "WHERE A.annotator_id=? "
            "AND A.target_ann_id=A1.id "
            "AND A1.project_id=? "
            "AND A1.text_id=? "
            "AND A1.annotator_id=1 "
            "AND A1.label_id = L1.id "
            "AND A.observer_ann_id=A2.id "
            "AND A2.project_id=? "
            "AND A2.text_id=? "
            "AND A2.annotator_id=1 "
            "AND A2.label_id = L2.id ",
            (annotator_id, project_id, text_id, project_id, text_id,)
        ).fetchall()
        
        for i in alignments_list:
            alignments[i['id']] = {
                'target_span': i['target_span'],
                'observer_span': i['observer_span'],
                'target_label': i['target_label'],
                'observer_label': i['observer_label'],
                'target_color': i['target_color'],
                'observer_color': i['observer_color']
            }
        
    except Exception as e:
      return e

    return flask.jsonify({'ok':True, 
                        'alignments': alignments,
                        'message': 'successfully get alignments'
                    }),\
        200, {'ContentType':'application/json'}


# get all alignment annotations for a text
@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/annotations/all_alignments', methods=['GET'])
@jwt_required()
def get_anns_align_all(project_id, text_id):
    connection = compAnn.model.get_db()
    try:
        target_len = len('target:\n\n')
        target_len += connection.execute("SELECT LENGTH(target_text) AS len FROM texts WHERE id=?",(text_id,)).fetchone()['len']
        targets_list = connection.execute(
            "SELECT A.id AS target_id, A.span AS target_span, A.span_start AS target_start, "
            "L.name AS target_label, L.color AS target_color "
            "FROM annotations AS A, labels AS L "
            "WHERE A.project_id = ? "
            "AND A.text_id = ? "
            "AND A.span_start <= ? "
            "AND A.annotator_id = 1 "
            "AND A.label_id = L.id",
            (project_id, text_id, target_len, )
        ).fetchall()

        annotations_list = connection.execute(
            "SELECT DISTINCT(A.id) AS alignment_id, A.annotator_id, ANT.username, "
            "ANT.id AS annotator_id, A.target_ann_id AS target_id, A2.id AS observer_id, "
            "A2.span AS observer_span, A2.span_start AS observer_start, "
            "L2.name AS observer_label, L2.color AS observer_color "
            "FROM alignments AS A, annotations AS A2, "
            "labels AS L2, annotators AS ANT "
            "WHERE A.observer_ann_id=A2.id "
            "AND A2.project_id = ? "
            "AND A2.text_id = ? "
            "AND A2.annotator_id = 1 "
            "AND A2.label_id = L2.id "
            "AND A.annotator_id = ANT.id",
            (project_id, text_id,)
        ).fetchall()

        alignments = []
        if len(targets_list) != 0 and len(annotations_list) != 0:
            targets_df = pd.DataFrame(targets_list)
            annotations_df = pd.DataFrame(annotations_list)
            alignments_df = targets_df.merge(annotations_df, on='target_id', how='left')
            alignments_df = alignments_df.groupby(['target_id', 'target_span', 'target_start', 'target_label', 'target_color'])
            # convert the df to json array format
            # [{'target_id':,
            #   'target_span':,
            #   'target_start':,
            #   'target_label':,
            #   'target_color':,
            #   'observers': [{
            #       'annotator_id':,
            #       'alignment_id':,
            #       'username':,
            #       'observer_span':,
            #       'observer_label':,
            #       'observer_color':,
            #       'checked':,
            #       ...
            #   }]
            # }, ...]
            for name, group in alignments_df:
                alignment_dict = {
                    'target_id': int(name[0]),
                    'target_span' : name[1],
                    'target_start': int(name[2]),
                    'target_label': name[3],
                    'target_color': name[4]
                }
                observers = []
                if not group.isnull().values.any():
                    observer_data = group.sort_values(by=['annotator_id'])
                    final_observer_ids = observer_data.query('annotator_id == 1')['observer_id']
                    final_observer_ids = list(final_observer_ids) if len(final_observer_ids)!=0 else []
                    for _, row in observer_data.iterrows():
                        observers.append({
                            'annotator_id': row['annotator_id'],
                            'alignment_id': row['alignment_id'],
                            'username': row['username'],
                            'observer_span': row['observer_span'],
                            'observer_label': row['observer_label'],
                            'observer_color': row['observer_color'],
                            'checked': row['observer_id'] in final_observer_ids
                        })
                alignment_dict['observers'] = observers
                alignments.append(alignment_dict)

            # sort by target_start
            alignments = sorted(alignments, key=lambda d: d['target_start']) 
    except Exception as e:
      return e

    return flask.jsonify({'ok':True, 
                        'alignments': alignments,
                        'message': 'successfully get alignments'
                    }),\
        200, {'ContentType':'application/json'}