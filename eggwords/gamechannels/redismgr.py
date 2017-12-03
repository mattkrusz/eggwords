import redis

_redis_connection = None

def redis_connection():
    '''Return a redis connection. Creates it if it does not exist yet.
    '''
    global _redis_connection
    if _redis_connection is None:
        _redis_connection = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)
    return _redis_connection
