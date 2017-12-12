import uuid
from datetime import datetime
import json

def normalize_word(w):
    return w.strip().lower()

def json_fallback(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError("Type %s not serializable" % type(obj))

class CustomJsonEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        elif isinstance(o, uuid.UUID):
            return str(o)
        else:
            return json.JSONEncoder.default(self, o)
