import redis
import json
import uuid
import random
from datetime import datetime, timedelta
import dateutil.parser
from django.utils import timezone
from enum import Enum

class GameStatus(Enum):
    WAITING   = 0
    SCHEDULED = 1
    PLAYING   = 2
    COMPLETED = 3

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
    def __init__(self, id, player_ids, used_words, start_time, end_time, created_time, letters):
        self.id = id
        self.player_ids = player_ids
        self.used_words = used_words
        self.start_time = start_time
        self.end_time = end_time
        self.created_time = created_time
        self.letters = letters

    def words_for(self, player_id):
        player_id = str(player_id)
        return [w for w,p_id in self.used_words.items() if player_id == p_id]

    def status_at_time(self, dtime=None):
        return __derive_game_status__(self.start_time, self.end_time, dtime)
    
    def json_dict(self):
        return {
            'gameId': str(self.id),
            'playerIds': list(self.player_ids),
            'usedWords': self.used_words,
            'startTime': self.start_time,
            'endTime': self.end_time,
            'letters': self.letters,
            'gameStatus': self.status_at_time().name,       
        }
    
    def __str__(self):
        return json.dumps(self.json_dict(), default=json_fallback)


class GameKeyIndex:
    
    def __init__(self, id):
        self.id = id
        self._game_key = 'games::game-' + str(self.id)    

    def game_key(self):
        return self._game_key

    def game_letters_key(self):
        return self.game_key() + ':letters'

    def game_created_key(self):
        return self.game_key() + ':created'

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


def init_game(game_id, player_ids):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.sadd(keys.game_players_key(), *(str(p) for p in player_ids))
    pipe.set(keys.game_created_key(), timezone.now().utcnow())
    pipe.execute()
    return game_id

def add_player(game_id, player_id):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.sadd(keys.game_players_key(), str(player_id))
    pipe.execute()
    return game_id

def start_game(game_id, words, countdown = 0, length = 90):    
    if get_game_status(game_id) not in [GameStatus.WAITING, GameStatus.SCHEDULED]:
        return False

    # Create a scrambled version of the available letters
    words.sort(key=lambda w: len(w), reverse=True)
    letters = list(words[0])
    random.shuffle(letters)
    letters = "".join(letters)
    
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.set(keys.game_letters_key(), letters)
    pipe.sadd(keys.word_set_key(), *words)
    start_time = timezone.now() + timedelta(seconds=countdown)
    end_time = start_time + timedelta(seconds=length)
    pipe.set(keys.game_start_key(), start_time.isoformat())
    pipe.set(keys.game_end_key(), end_time.isoformat())
    pipe.execute()

    return True

def get_game_state(game_id):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.smembers(keys.game_players_key())
    pipe.hgetall(keys.used_words_set_key())
    pipe.get(keys.game_start_key())
    pipe.get(keys.game_end_key())
    pipe.get(keys.game_created_key())
    pipe.get(keys.game_letters_key())
    res = pipe.execute()
    return GameState(
        game_id,
        res[0],
        res[1],
        res[2],
        res[3],
        res[4],
        res[5],
    )

def __derive_game_status__(start: str, end: str, at_time=None):
    if at_time is None:
        at_time = timezone.now()

    if start and end:
            start_parsed = dateutil.parser.parse(start)     
            end_parsed = dateutil.parser.parse(end)
            if at_time <= start_parsed:
                return GameStatus.SCHEDULED
            elif at_time < end_parsed:
                return GameStatus.PLAYING
            else:
                return GameStatus.COMPLETED
    else:
        return GameStatus.WAITING    

def get_game_status(game_id):    
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.get(keys.game_start_key())
    pipe.get(keys.game_end_key())
    res = pipe.execute()
    start = res[0]
    end = res[1]
    return __derive_game_status__(start, end)

def use_word(game_id, player_id, word):
    keys = GameKeyIndex(game_id)
    game_status = get_game_status(game_id)
    if game_status == GameStatus.PLAYING:        
        success = r.srem(keys.word_set_key(), word)    
        if success:
            r.hset(keys.used_words_set_key(), normalize_word(word), str(player_id))
            return True
        else:
            return False    
    else:
        return False

def end_game(game_id):
    keys = GameKeyIndex(game_id)
    r.set(keys.game_end_key(), timezone.now().isoformat())    

def clean_up_game(game_id):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    for k in r.scan_iter(match=keys.game_key() + "*"):
        pipe.delete(k)
    pipe.execute()