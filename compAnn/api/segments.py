import flask
import compAnn
import pandas as pd
import numpy as np
import re
from flask_jwt_extended import jwt_required, get_jwt_identity

# check if the current index falls in between an annotation
# anns is ordered by span_start, ascending
def get_seg_end(anns, index):
    seg_end = index
    for ann in anns:
        if seg_end >= ann[1]: continue # index is larger than the end of annotation
        elif seg_end > ann[0]: # within an annotation
            seg_end = ann[1]
        else: break
    return seg_end


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/segments', methods=['GET'])
@jwt_required()
def get_segments(project_id, text_id):
    connection = compAnn.model.get_db()
    
    # get spans to determine if the segment falls within the user's annotation
    try:
        anns = connection.execute(
            "SELECT A.span_start, A.span_end "
            "FROM annotations AS A "
            "WHERE A.project_id=? "
            "AND A.text_id=? "
            "ORDER BY A.span_start ASC, A.span_end ASC;",
            (project_id, text_id, )
        ).fetchall()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get spans'
                                  }),\
                 500, {'ContentType':'application/json'}            
    # get notes spans to determine if the segment falls within the note range
    try:
        note_spans = connection.execute(
            "SELECT refer_start AS span_start, refer_end AS span_end "
            "FROM quick_notes WHERE project_id=? AND text_id=? "
            "ORDER BY refer_start ASC, refer_end ASC;",
            (project_id, text_id,)
        ).fetchall()
        if anns != [] and note_spans != []:
            anns = pd.DataFrame(anns)
            note_spans = pd.DataFrame(note_spans)
            allspans = pd.concat([anns, note_spans], ignore_index=True, axis=0)\
                            .sort_values(by=['span_start', 'span_end']).values.tolist()
        elif anns != []:
            anns = pd.DataFrame(anns)
            allspans = anns.values.tolist()
        elif note_spans != []:
            note_spans = pd.DataFrame(note_spans)
            allspans = note_spans.values.tolist()
        else:
            allspans = []

    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get spans'
                                  }),\
                 500, {'ContentType':'application/json'}     
    
    try:
        text = connection.execute(
            "SELECT full_text from texts "
            "WHERE id=?",
            (text_id,)
        ).fetchone()
    except Exception as e:
        return e
    full_text = text['full_text']
    
    # greedy algorithm to split the full text into segments
    min_len = compAnn.app.config['MIN_SEG_LEN']
    max_len = compAnn.app.config['MAX_SEG_LEN']
    segment_pos = []
    prev_idx = 0
    if len(full_text) >= min_len:
        # calcuate text segment
        par_index = [_.end() for _ in re.finditer(r'[\n\.?!]+', full_text)]
        for i in par_index:
            if i < prev_idx: continue
            if (i-prev_idx) <=3 and segment_pos != []:
                segment_pos[-1] = i
                prev_idx = i
                continue
            if (i-prev_idx) < min_len :
                continue
            if (i-prev_idx) > max_len:
                seg_end = get_seg_end(allspans, i)
                segment_pos.append(seg_end)
                prev_idx = seg_end
    if len(segment_pos) == 0 or (len(segment_pos) !=0 and segment_pos[-1]!=len(full_text)):
        segment_pos.append(len(full_text))

    # split text
    prev_seg = 0
    text_seg = []
    for idx, seg in enumerate(segment_pos):
        # till seg
        text_seg.append(full_text[prev_seg:seg])
        prev_seg = seg


    # get annotation data
    try:
        annotations = connection.execute(
            "SELECT ANT.email, ANT.username, A.span_start, A.span_end, L.name, L.color "
            "FROM annotations AS A, labels AS L, annotators AS ANT "
            "WHERE A.project_id = ? AND A.text_id = ? AND A.label_id = L.id AND A.annotator_id = ANT.id ",
            (project_id, text_id, )
        ).fetchall()
    except Exception as e:
        return e
    if annotations == []:
        annotated = False
        output = []
    else:
        annotated = True
        
        ann_df = pd.DataFrame(annotations)
        annotators = ann_df['email'].unique()
        ann_df = ann_df.sort_values(by=['span_start'])
        ann_df['list'] = ann_df.apply(lambda x: [x['span_start'], x['span_end'], x['name'], x['color']], axis=1)
        ann_list = ann_df.groupby('email')['list'].apply(list)
        
        # creat segment annotation dict
        num_segs = len(segment_pos)

        # output format
        # [{'3': {'name': 'Jiamin', 'spans': [[32, 111, 'Anticipated Effort', '#D7BDE2'],
        #                                     [113, 146, 'Situational Control', '#BCC6DC'], 
        #                                     [384, 424, 'Pleasantness', '#E6B0AA']]}}, 
        # {'3': {'name': 'Jiamin', 'spans': [[25, 120, 'Self-Other Agency', '#FAE5D3'],
        #                                    [122, 211, 'Anticipated Effort', '#D7BDE2'], 
        #                                    [220, 263, 'Situational Control', '#BCC6DC'], 
        #                                    [267, 312, 'Pleasantness', '#E6B0AA'], 
        #                                    [431, 472, 'Situational Control', '#BCC6DC']]}}, 
        # {'3': {'name': 'Jiamin', 'spans': []}},
        # {'3': {'name': 'Jiamin', 'spans': []}}, 
        # {'3': {'name': 'Jiamin', 'spans': []}}]
        output = []
        for i in range(num_segs):
            dict_agg = {}
            for att in annotators:
                name = ann_df.loc[ann_df['email'] == att, 'username'].values[0]
                ann_d = {
                    'name': name,
                    'spans': []
                }
                dict_agg[att] = ann_d
            output.append(dict_agg)
        prev_seg = 0
        for idx, seg in enumerate(segment_pos):
            for ann_id in annotators:
                for s_i in \
                    range(len(ann_list.loc[ann_id])):
                    span = ann_list.loc[ann_id][s_i]
                    if span[1] <= prev_seg or span[0] >= seg:
                        continue
                    new_span = [max(span[0], prev_seg)-prev_seg,
                                min(span[1], seg)-prev_seg, 
                                span[2],
                                span[3]]
                    output[idx][ann_id]['spans'].append(new_span)
            prev_seg = seg
    segment_pos = [0] + segment_pos
    context = {
        "annotated": annotated,
        "text_seg": text_seg,
        "ann_seg": output,
        "segments": segment_pos
    }
    return flask.jsonify(**context)