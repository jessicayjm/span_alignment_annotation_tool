import flask
import compAnn
import pandas as pd
import numpy as np
from flask_jwt_extended import jwt_required

from pygamma_agreement import (CombinedCategoricalDissimilarity,
                               Continuum)
from pyannote.core import Segment


@compAnn.app.route('/projects/<int:project_id>/update_agreement', methods=['POST'])
@jwt_required()
def update_pre_agreement(project_id):
    alpha = compAnn.app.config['ALPHA']
    beta = compAnn.app.config['BETA']
    is_pre = flask.request.json['isPre']

    connection = compAnn.model.get_db()
    # get annotations if the text has been annotated by at least two annotators
    try:
        text_ids = connection.execute(
            "SELECT NUM_A.text_id FROM"
            "(SELECT text_id, COUNT(DISTINCT annotator_id) AS annotated_by "
            "FROM annotations "
            "WHERE project_id = ? AND annotator_id != 1 "
            "GROUP BY text_id) AS NUM_A "
            "WHERE NUM_A.annotated_by >= 2;",
            (project_id, )
        ).fetchall()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get text_ids'
                                  }),\
                500, {'ContentType':'application/json'}
    # for each text, add annotations to continuum
    try:
        for i in text_ids:
            text_id = i['text_id']
            annotations = connection.execute(
                "SELECT annotator_id, label_id, span_start, span_end "
                "FROM annotations WHERE project_id = ? AND text_id = ? AND annotator_id != 1;",
                (project_id, text_id, )
            ).fetchall()
            sim_scores = []
            for _ in range(compAnn.app.config['CAL_TIMES']):
                continuum = Continuum()
                for ann in annotations:
                    continuum.add(ann['annotator_id'], Segment(ann['span_start'], ann['span_end']), ann['label_id'])
                dissim = CombinedCategoricalDissimilarity(alpha=alpha, beta=beta)
                gamma_results = continuum.compute_gamma(dissim)
                sim_scores.append(gamma_results.gamma)
            
            if is_pre:
                # store the mean and std
                connection.execute(
                    "UPDATE project_texts SET agreement_pre_review_mean = ?, agreement_pre_review_std = ? "
                    "WHERE project_id = ? AND text_id = ?;",
                    (np.mean(sim_scores), np.std(sim_scores), project_id, text_id,)
                )
            else:
                connection.execute(
                    "UPDATE project_texts SET agreement_post_review_mean = ?, agreement_post_review_std = ? "
                    "WHERE project_id = ? AND text_id = ?;",
                    (np.mean(sim_scores), np.std(sim_scores), project_id, text_id,)
                )
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot add to continuum'
                                  }),\
                500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':False, 
                            'message': 'Successfully updated the review agreement score'
                            }),\
        200, {'ContentType':'application/json'}
