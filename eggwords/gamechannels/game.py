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
    def __init__(self, id):
        self.id = id
    
    def game_key(self):
        return 'games::game-' + str(self.id)

    def game_start_key(self):
        return self.game_key() + ':start'

    def game_players_key(self):
        return self.game_key() + ':players'

    def word_set_key(self):
        return self.game_key() + ':words'

    def player_key(self, player_id):
        return self.game_key() + ':players:' + str(player_id)

    def player_words_key(self, player_id):
        return self.player_key(player_id) + ':words'

    def players(self):
        return r.smembers(self.game_players_key())

    def player_words(self, player_id):
        return r.smembers(self.player_words_key(player_id))

    def player_add_word(self, player_id, word):
        r.sadd(self.player_words_key(player_id), normalize_word(word))

    def init_game(self, words, player_ids):     
        pipe = r.pipeline()   
        pipe.sadd(self.word_set_key(), *words)
        pipe.set(self.game_start_key(), datetime.utcnow().isoformat())
        pipe.sadd(self.game_players_key(), *(str(p) for p in player_ids))
        pipe.execute()
    
    def get_words(self):
        return r.get(self.word_set_key())
    
    def use_word(self, player_id, word):
        success = r.srem(self.word_set_key(), word)
        if success:
            self.player_add_word(player_id, word)
            return True
        else:
            return False

    def clean_up(self):
        pipe = r.pipeline()
        for k in r.scan_iter(match=self.game_key() + "*"):
            pipe.delete(k)
        pipe.execute()