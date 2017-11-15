import redis
import json
import uuid
import random, collections
from datetime import datetime, timedelta
from gamechannels.score import score_game
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
    def __init__(self, id, player_info, used_words, start_time, end_time, created_time, 
        letters, word_count):
        self.id = id
        self.player_ids = list(player_info.keys())
        self.player_info = player_info
        self.used_words = used_words
        self.start_time = start_time
        self.end_time = end_time
        self.created_time = created_time
        self.letters = letters
        self.word_count = word_count

    def words_for(self, player_id):
        player_id = str(player_id)
        return [w for w,p_id in self.used_words.items() if player_id == p_id]

    def status(self):
        return self.status_at_time()

    def status_at_time(self, dtime=None):
        return __derive_game_status__(self.start_time, self.end_time, dtime)
    
    def score(self):
        return score_game(self)

    def json_dict(self):
        return {
            'gameId': str(self.id),    
            'playerIds': list(self.player_ids),
            'playerInfo': self.player_info,
            'usedWords': self.used_words,
            'wordCount': self.word_count,
            'startTime': self.start_time,
            'endTime': self.end_time,
            'letters': self.letters,
            'gameStatus': self.status_at_time().name,
            'score': self.score()
        }

    def exists(self):
        return self.created_time is not None
    
    def __str__(self):
        return json.dumps(self.json_dict(), default=json_fallback)


class GameKeyIndex:

    keys = {
        'game_key': '{game_key}',
        'game_letters_key': '{game_key}:letters',
        'game_created_key': '{game_key}:created',
        'game_start_key': '{game_key}:start',
        'game_end_key': '{game_key}:end',
        'game_players_key': '{game_key}:players',
        'game_word_count_key': '{game_key}:wordcount',
        'word_set_key': '{game_key}:words',
        'player_key': '{game_key}:players',
        'used_words_set_key': '{game_key}:usedwords',
    }
    
    def __init__(self, id):
        self.id = id
        self._game_key = 'games::game-' + str(self.id)

    def game_key(self):
        return self._game_key

    def __with_game_key__(self, key_string):
        return key_string.format(game_key = self._game_key)

    def __key__(self, key_name):
        return self.__with_game_key__(self.keys[key_name])

    def game_letters_key(self):
        return self.__key__('game_letters_key')

    def game_wc_key(self):
        return self.__key__('game_word_count_key')

    def game_created_key(self):
        return self.__key__('game_created_key')

    def game_start_key(self):
        return self.__key__('game_start_key')

    def game_end_key(self):
        return self.__key__('game_end_key')

    def game_players_key(self):
        return self.__key__('game_players_key')

    def word_set_key(self):
        return self.__key__('word_set_key')

    def player_key(self, player_id):
        return self.__key__('player_key')

    def used_words_set_key(self):
        return self.__key__('used_words_set_key')

    def __iter__(self):
        for key_name in self.keys.keys():
            yield self.__key__(key_name)
            

def init_game(game_id, player_ids):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    
    player_info = {pid : '{}' for pid in player_ids }
    pipe.hmset(keys.game_players_key(), player_info)
    pipe.set(keys.game_created_key(), timezone.now().utcnow())
    pipe.execute()
    return game_id

def reinit_game(game_id):
    keys = GameKeyIndex(game_id)
    pipe = r.pipeline()    
    exclude_keys = [
        keys.game_players_key()
    ]
    for k in keys:
        if k not in exclude_keys:
            pipe.delete(k)
    pipe.set(keys.game_created_key(), timezone.now().utcnow())            
    pipe.execute()
    return game_id

def add_player(game_id, player_id):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.hset(keys.game_players_key(), str(player_id), '{}')
    pipe.execute()
    return game_id

def start_game(game_id, words, countdown = 0, length = 90):    
    if get_game_status(game_id) not in [GameStatus.WAITING, GameStatus.SCHEDULED]:
        return False

    word_set = set(words)

    # Create a scrambled version of the available letters
    words.sort(key=lambda w: len(w), reverse=True)
    letters = list(words[0])
    random.shuffle(letters)
    letters = "".join(letters)
    letter_count = len(letters)        

    word_count_dic = collections.Counter((len(w) for w in word_set))
    word_count_arr = [0] * (letter_count + 1)
    for (w_length, w_count) in word_count_dic.items():
        word_count_arr[w_length] = w_count
    
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.set(keys.game_letters_key(), letters)
    pipe.sadd(keys.word_set_key(), *word_set)
    start_time = timezone.now() + timedelta(seconds=countdown)
    end_time = start_time + timedelta(seconds=length)
    pipe.set(keys.game_start_key(), start_time.isoformat())
    pipe.set(keys.game_end_key(), end_time.isoformat())
    pipe.rpush(keys.game_wc_key(), *word_count_arr)
    pipe.execute()

    return True

def set_expiry(game_id, seconds):
    keys = GameKeyIndex(game_id)
    pipe = r.pipeline()
    for key in keys:
        pipe.expire(key, seconds)
    pipe.execute()

def get_game_words(game_id):
    keys = GameKeyIndex(game_id)
    words = r.smembers(keys.word_set_key())
    return words

def get_game_state(game_id):
    pipe = r.pipeline()
    keys = GameKeyIndex(game_id)
    pipe.hgetall(keys.game_players_key())
    pipe.hgetall(keys.used_words_set_key())
    pipe.get(keys.game_start_key())
    pipe.get(keys.game_end_key())
    pipe.get(keys.game_created_key())
    pipe.get(keys.game_letters_key())
    pipe.lrange(keys.game_wc_key(), 0, -1)
    res = pipe.execute()

    player_info = res[0]
    player_info_deserialized = { pid:json.loads(info_json) for (pid, info_json) in player_info.items() }

    return GameState(
        game_id,
        player_info_deserialized,
        res[1],
        res[2],
        res[3],
        res[4],
        res[5],
        res[6]
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

def update_player_name(game_id, player_id, new_name):
    keys = GameKeyIndex(game_id)
    player_info = json.loads(r.hget(keys.game_players_key(), player_id))
    player_info['name'] = new_name
    r.hset(keys.game_players_key(), player_id, json.dumps(player_info))
    return player_info