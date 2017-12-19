import random
from typing import Union
import uuid

from gamechannels.redismgr import redis_connection
from gamechannels.gameexceptions import *

redis = redis_connection()
alias_chars = list('abcdefghijklmnopqrstuvwxyz0123456789')
MAX_TRIES = 5

def alias_key(alias: str):
    return 'gamealias::' + str(alias)

def create_game_alias(game_id: Union[str, uuid.UUID], length: int = 5) -> str:
    success = 0
    n_tries = 0
    while not success and n_tries < MAX_TRIES:
        alias = "".join([random.choice(alias_chars)
                         for _ in range(length)])
        key = alias_key(alias)
        success = redis.setnx(key, str(game_id))
        n_tries += 1

    if not success:
        return None

    redis.expire(key, 86400)
    return alias


def dealias_game(alias: str) -> str:
    dealiased = redis.get(alias_key(alias))
    if dealiased is None:
        raise GameAliasNotFound(f'No game found with alias [{alias}].')
    return dealiased
