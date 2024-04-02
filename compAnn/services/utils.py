"""utils.py."""

import flask
import compAnn


class InvalidUsage(Exception):
    """Invalid usage."""

    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        """Initialize."""
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        """To dict."""
        return_value = dict(self.payload or ())
        return_value['message'] = self.message
        return_value["status_code"] = self.status_code
        return return_value


@compAnn.app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    """Handle incalid usage."""
    response = flask.jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

