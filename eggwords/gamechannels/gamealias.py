import random

from gamechannels.redismgr import redis_connection

r = redis_connection()
alias_chars = list('abcdefghijklmnopqrstuvwxyz0123456789')
MAX_TRIES = 5

def alias_key(alias):
    return 'gamealias::' + str(alias)

def create_game_alias(game_id, length=5):
    success = 0
    n_tries = 0
    while not success and n_tries < MAX_TRIES:
        alias = "".join([random.choice(alias_chars)
                             for _ in range(length)])
        key = alias_key(alias)
        success = r.setnx(key, str(game_id))
        n_tries += 1
    
    if not success:
        return None
    
    r.expire(key, 86400)
    return alias    


def dealias_game(alias):
    return r.get(alias_key(alias))
