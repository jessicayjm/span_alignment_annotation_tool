import re
import flask
import compAnn
import compAnn.services.auth as auth
from flask_jwt_extended import unset_jwt_cookies, get_jwt_identity


@compAnn.app.route('/login', methods=['POST'])
def login():
    email = flask.request.json['email']
    password = flask.request.json['password']

    # admin@admin is inaccessiable to all users
    if email == 'admin@admin':
        return flask.jsonify({'ok':False, 
                                    'message': 'Error: Unauthorized.'
                                    }),\
                    403, {'ContentType':'application/json'}
    
    password_encoded = auth.encode_password(password)

    connection = compAnn.model.get_db()
    try:
        # get the correct password
        password_true = connection.execute(
            "SELECT password FROM annotators WHERE email = ?;",
            (email,)
        ).fetchone()['password']

        # if password is '', then the user is having default setting of password
        # prompt to reset password
        # but the user is still able to access the website
        if password_true == '':
            # generate token 
            access_token = auth.generate_token(email)
            # verify password against password_regex
            isValid = re.match(compAnn.app.config['PASSWORD_REGEX'], password)
            if not isValid:
                return flask.jsonify({'ok':False, 
                                    'message': compAnn.config['PASSWORD_MESSAGE']
                                    }),\
                                400, {'ContentType':'application/json'}
            try:
                # store into db
                connection.execute(
                    "UPDATE annotators "
                    "SET password = ? "
                    "WHERE email = ?;",
                    (password_encoded, email,)
                )
            except:
                return flask.jsonify({'ok':False, 
                                    'message': "Error: cannot update the password."
                                    }),\
                                500, {'ContentType':'application/json'} 
            return flask.jsonify({'ok':True, 
                                    'message': 'successfully log in.',
                                    'access_token': access_token,
                                    'reset_password': True,
                                    }),\
                    200, {'ContentType':'application/json'}
        else:
            verified = auth.verify_password(password_true, password)
            if not verified:
                return flask.jsonify({'ok':False, 
                                    'message': 'Error: wrong email or password.'
                                    }),\
                            401, {'ContentType':'application/json'}
    except:
        return flask.jsonify({'ok':False, 
                            'message': 'Error: wrong email or password.'
                            }),\
                        401, {'ContentType':'application/json'}
    
    # generate token 
    access_token = auth.generate_token(email)
    return flask.jsonify({'ok':True, 
                        'message': 'successfully log in.',
                        'access_token': access_token,
                        'reset_password': False,
                        }),\
                    200, {'ContentType':'application/json'}


@compAnn.app.route('/login/reset_pass', methods=['POST'])
def reset_password():
    try:
      email = get_jwt_identity()
    except Exception as e:
            return flask.jsonify({'ok':False, 
                                  'message': 'Error: invalid token'
                                  }),\
                 400, {'ContentType':'application/json'} 
    password = flask.request.json['password']

    connection = compAnn.model.get_db()

    # verify password against password_regex
    re_pattern = re.compile(compAnn.config['PASSWORD_REGEX'])
    isValid = re_pattern.match(password)
    if not isValid:
        return flask.jsonify({'ok':False, 
                                        'message': compAnn.config['PASSWORD_MESSAGE']
                                        }),\
                        400, {'ContentType':'application/json'}
    try:
        encoded_password = auth.encode_password(password)
        # store into db
        connection.execute(
            "UPDATE users "
            "SET password = ? "
            "WHERE email = ?;",
            (encoded_password, email)
        )
    except:
        return flask.jsonify({'ok':False, 
                                        'message': "Error: cannot update the password."
                                        }),\
                        500, {'ContentType':'application/json'}   

    return flask.jsonify({'ok':True, 
                                    'message': 'successfully update the password.',
                                    }),\
                    200, {'ContentType':'application/json'}


@compAnn.app.route("/logout", methods=["POST"])
def logout():
    response = flask.jsonify({"message": "logout successfully"})
    unset_jwt_cookies(response)
    return response