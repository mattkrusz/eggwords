import redis
import json
import uuid
from datetime import datetime

r = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

def normalize_word(w):
    return w.strip().lower()

def json_fallback(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError ("Type %s not serializable" % type(obj))

class GameState:
    
    def __init__(self, id, player_ids, used_words, start_time, end_time):
        self.id = id
        self.player_ids = player_ids
        self.used_words = used_words
        self.start_time = start_time
        self.end_time = end_time

    def words_for(self, player_id):
        player_id = str(player_id)
        return [w for w,p_id in self.used_words.items() if player_id == p_id]
    
    def __str__(self):
        return json.dumps({
            'id': self.id,
            'player_ids': list(self.player_ids),
            'used_words': self.used_words,
            'start_time': self.start_time,
            'end_time': self.end_time            
        }, default=json_fallback)


class GameKeyIndex:
    
    def __init__(self, id):
        self.id = id
        self._game_key = 'games::game-' + str(self.id)

    def game_key(self):
        return self._game_key

    def game_start_key(self):
        return self.game_key() + ':start'

    def game_end_key(self):
        return self.game_key() + ':end'

    def game_players_key(self):
        return self.game_key() + ':players'

    def word_set_key(self):
        return self.game_key() + ':words'

    def player_key(self, player_id):
        return self.game_key() + ':players:' + str(player_id)

    def used_words_set_key(self):
        return self.game_key() + ':usedwords'


def init_game(game_id, player_ids, words):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.sadd(keys.word_set_key(), *words)
    pipe.set(keys.game_start_key(), datetime.utcnow().isoformat())
    pipe.sadd(keys.game_players_key(), *(str(p) for p in player_ids))
    pipe.execute()
    return game_id

def get_game_state(game_id):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.smembers(keys.game_players_key())
    pipe.hgetall(keys.used_words_set_key())
    pipe.get(keys.game_start_key())
    pipe.get(keys.game_end_key())
    res = pipe.execute()
    return GameState(
        game_id,
        res[0],
        res[1],
        res[2],
        res[3]
    )

def use_word(game_id, player_id, word):
    keys = GameKeyIndex(game_id)
    success = r.srem(keys.word_set_key(), word)    
    if success:
        r.hset(keys.used_words_set_key(), normalize_word(word), str(player_id))
        return True
    else:
        return False    

def end_game(game_id):
    keys = GameKeyIndex(game_id)
    r.setnx(keys.game_end_key(), datetime.utcnow().isoformat())

def clean_up_game(game_id):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    for k in r.scan_iter(match=keys.game_key() + "*"):
        pipe.delete(k)
    pipe.execute()