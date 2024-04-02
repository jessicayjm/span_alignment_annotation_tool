import flask
import compAnn
import pandas as pd
from flask_jwt_extended import jwt_required, get_jwt_identity

@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/get_quick_note', methods=['POST'])
@jwt_required()
def get_quick_note(project_id, text_id):
    seg_start = flask.request.json['seg_start']
    seg_end = flask.request.json['seg_end']
    isPrivate = flask.request.json['isPrivate']
    notes = {}

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
    
    if isPrivate:
      try:
        tmp_notes = connection.execute(
          "SELECT A.username, A.id AS annotator_id, QN.id AS note_id, QN.content AS note "
          "FROM quick_notes AS QN, annotators AS A "
          "WHERE QN.project_id=? "
          "AND QN.text_id=? "
          "AND QN.refer_start>=? "
          "AND QN.refer_end<=? "
          "AND QN.isPrivate=? "
          "AND QN.annotator_id=A.id "
          "AND A.id=?"
          "ORDER BY QN.id ASC;",
          (project_id, text_id, seg_start, seg_end, isPrivate, annotator_id,)
        ).fetchall()
      except Exception as e:
          return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot get notes'
                                }),\
                500, {'ContentType':'application/json'}

    else:
        connection = compAnn.model.get_db()
        try:
          tmp_notes = connection.execute(
            "SELECT A.username, A.id AS annotator_id, QN.id AS note_id, QN.content AS note "
            "FROM quick_notes AS QN, annotators AS A "
            "WHERE QN.project_id=? "
            "AND QN.text_id=? "
            "AND QN.refer_start>=? "
            "AND QN.refer_end<=? "
            "AND QN.isPrivate=? "
            "AND QN.annotator_id=A.id "
            "ORDER BY QN.id ASC;",
            (project_id, text_id, seg_start, seg_end, isPrivate,)
          ).fetchall()
        except Exception as e:
          return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot get notes'
                                }),\
                500, {'ContentType':'application/json'}
    try:
      for note in tmp_notes:
        tmp_quotes = connection.execute(
          "SELECT Q.id AS quote_id, Q.content as quotes "
          "FROM quotes as Q, note_quotes AS NQ "
          "WHERE Q.id=NQ.quote_id AND NQ.note_id=?;",
          (note['note_id'],)
        ).fetchall()
        quote_ids = [i['quote_id'] for i in tmp_quotes]
        quotes = [i['quotes'] for i in tmp_quotes]
        allow_delete = note['annotator_id'] == annotator_id
        notes[str(note['note_id'])] = {
          'name': note['username'],
          'note_id': note['note_id'],
          'quote_ids': quote_ids, 
          'quotes': quotes,
          'note': note['note'],
          'allow_delete': allow_delete
        }
    except Exception as e:
        return flask.jsonify({'ok':False, 
                              'message': 'Error: cannot get quotes'
                              }),\
              500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                          'message': 'successfully list notes',
                          'notes': notes,
                          }),\
          200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/add_quick_note', methods=['POST'])
@jwt_required()
def add_quick_note(project_id, text_id):
    refer_start = flask.request.json['refer_start']
    refer_end = flask.request.json['refer_end']
    content = flask.request.json['content']
    isPrivate = flask.request.json['isPrivate']
    quotes = flask.request.json['quotes']

    if content == '':
      return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot submit with no notes'
                                  }),\
                 400, {'ContentType':'application/json'}
    
    try:
      email = get_jwt_identity()
    except Exception as e:
        return flask.jsonify({'ok':False, 
                              'message': 'Error: invalid token'
                              }),\
              400, {'ContentType':'application/json'}
    
    connection = compAnn.model.get_db()
    
    try:
      annotator_info = connection.execute(
        "SELECT id, username FROM annotators "
        "WHERE email = ?;",
        (email, )
    ).fetchone()
      annotator_id = annotator_info['id']
      annotator_name = annotator_info['username']
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get annotator id'
                                  }),\
                 500, {'ContentType':'application/json'}
    # add note and get the note_id
    try:
        connection.execute(
            "INSERT INTO quick_notes(project_id, text_id, annotator_id, refer_start, "
            "refer_end, content, isPrivate) "
            "VALUES(?,?,?,?,?,?,?);",
            (project_id, 
             text_id, 
             annotator_id, 
             refer_start, 
             refer_end, 
             content, 
             isPrivate,)
        )
        note_id = connection.execute(
                "SELECT last_insert_rowid()"
            ).fetchone()['last_insert_rowid()']
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot add note'
                                  }),\
                 500, {'ContentType':'application/json'}
    
    # insert quotes and get ids
    quote_ids = []
    try:
        for quote in quotes:
          connection.execute(
              "INSERT INTO quotes(content) "
              "VALUES(?);",
              (quote,)
          )
          quote_id = connection.execute(
                "SELECT last_insert_rowid()"
            ).fetchone()['last_insert_rowid()']
          quote_ids.append(quote_id)
    except Exception as e:
        # delete the note
        connection.execute(
          "DELETE FROM quick_notes WHERE id=?;",
          (note_id, )
        )
        # delete quotes
        for quote_id in quote_ids:
          connection.execute(
              "DELETE FROM quotes WHERE id=?;",
              (quote_id,)
          )
        return flask.jsonify({'ok':False, 
                              'message': 'Error: cannot add quotes'
                              }),\
              500, {'ContentType':'application/json'}
    try:
        for quote_id in quote_ids:
          connection.execute(
              "INSERT INTO note_quotes(note_id, quote_id) "
              "VALUES(?,?);",
              (note_id, quote_id,)
          )
    except Exception as e:
        # delete the note
        connection.execute(
          "DELETE FROM quick_notes WHERE id=?;",
          (note_id, )
        )
        # delete quotes
        for quote_id in quote_ids:
          connection.execute(
              "DELETE FROM quotes WHERE id=?;",
              (quote_id,)
          )
        return flask.jsonify({'ok':False, 
                              'message': 'Error: cannot add quotes'
                              }),\
              500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                          'note_id': note_id,
                          'quote_ids': quote_ids,
                          'quotes': quotes,
                          'content': content,
                          'username': annotator_name,
                          'allow_delete': True,
                          'message': 'successfully add note',
                          }),\
          200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/delete_quick_note', methods=['POST'])
@jwt_required()
def delete_quick_note(project_id, text_id):
    note_id = flask.request.json['note_id']
    quote_ids = flask.request.json['quote_ids']

    connection = compAnn.model.get_db()
    try:
      connection.execute(
        "DELETE FROM quick_notes WHERE id=?;",
        (note_id, )
      )
      for quote_id in quote_ids:
        connection.execute(
          "DELETE FROM quotes WHERE id=?;",
          (quote_id, )
        )
      # the note_quotes should be automatically deleted by the db
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot delete note'
                                  }),\
                 500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                                    'message': 'successfully delete note.',
                                    }),\
                    200, {'ContentType':'application/json'}


@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/get_rich_note', methods=['GET'])
@jwt_required()
def get_rich_note(project_id, text_id):
    try:
        email = get_jwt_identity()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: invalid token'
                                  }),\
                400, {'ContentType':'application/json'}
    
    connection = compAnn.model.get_db()
    try:
      content = connection.execute(
        "SELECT R.content FROM rich_notes AS R, annotators AS A "
        "WHERE R.project_id=? AND R.text_id=? AND R.annotator_id=A.id AND A.email=?;",
        (project_id, text_id, email, )
      ).fetchall()
      if len(content)==0 : content = ''
      else: content=content[0]['content']
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot get annotator id'
                                  }),\
                 500, {'ContentType':'application/json'}
    return flask.jsonify({'ok':True, 
                          'message': 'successfully get rich note.',
                          'content': content,
                          }),\
          200, {'ContentType':'application/json'}



@compAnn.app.route('/projects/<int:project_id>/text-<int:text_id>/add_rich_note', methods=['POST'])
@jwt_required()
def add_rich_note(project_id, text_id):
    content = flask.request.json['content']

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
        
    # check if for the text in current project, the annotator already has rich note.
    try:
      has_rich_note = connection.execute(
        "SELECT EXISTS(SELECT 1 FROM rich_notes "
        "WHERE project_id=? AND text_id = ? AND annotator_id = ?) AS has_note",
        (project_id, text_id, annotator_id,)
      ).fetchone()['has_note']
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: cannot check user note info'
                                  }),\
                 500, {'ContentType':'application/json'}
    if has_rich_note:
      try:
        connection.execute(
          "UPDATE rich_notes SET content=? "
          "WHERE project_id=? AND text_id=? AND annotator_id=?;",
          (content, project_id, text_id, annotator_id,)
        )
      except Exception as e:
          return flask.jsonify({'ok':False, 
                                'message': 'Error: cannot update note'
                                }),\
                500, {'ContentType':'application/json'}
      return flask.jsonify({'ok':True, 
                                    'message': 'successfully updated note.',
                                    }),\
                    200, {'ContentType':'application/json'}
    else:
      try:
          connection.execute(
              "INSERT INTO rich_notes(project_id, text_id, annotator_id, content) "
              "VALUES(?,?,?,?);",
              (project_id, 
               text_id, 
               annotator_id, 
               content,)
          )
      except Exception as e:
              return flask.jsonify({'ok':False, 
                                    'message': 'Error: cannot update note'
                                    }),\
                  500, {'ContentType':'application/json'}
      return flask.jsonify({'ok':True, 
                            'message': 'successfully updated note.',
                            }),\
            200, {'ContentType':'application/json'}