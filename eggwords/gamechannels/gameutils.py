
def normalize_word(w):
    return w.strip().lower()


def json_fallback(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError("Type %s not serializable" % type(obj))
