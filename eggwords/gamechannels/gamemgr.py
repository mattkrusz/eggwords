
import dateutil.parser
from datetime import datetime, timedelta
import json, uuid, random, collections

from django.utils import timezone

from gamechannels.score import score_game
from gamechannels.game import GameStatus, GameState, derive_game_status
from gamechannels.redismgr import redis_connection
from gamechannels.gameutils import *

r = redis_connection()

class RedisGameManager:
    def __init__(self, redis_connection=r):
        self.redis = redis_connection
        self.try_word_script = self._init_try_word_script()

    def init_game(self, game_id, player_ids):
        keys = RedisGameKeyIndex(game_id)
        pipe = self.redis.pipeline()
        player_info = {pid: '{}' for pid in player_ids}
        pipe.hmset(keys.game_players_key(), player_info)
        pipe.set(keys.game_created_key(), timezone.now().utcnow())
        pipe.execute()
        return game_id

    def reinit_game(self, game_id):
        keys = RedisGameKeyIndex(game_id)
        pipe = self.redis.pipeline()
        exclude_keys = [
            keys.game_players_key()
        ]
        for k in keys:
            if k not in exclude_keys:
                pipe.delete(k)
        pipe.set(keys.game_created_key(), timezone.now().utcnow())
        pipe.execute()
        return game_id

    def add_player(self, game_id, player_id):
        keys = RedisGameKeyIndex(game_id)
        pipe = self.redis.pipeline()
        pipe.hset(keys.game_players_key(), str(player_id), '{}')
        pipe.execute()
        return game_id

    def remove_player(self, game_id, player_id):
        keys = RedisGameKeyIndex(game_id)
        pipe = self.redis.pipeline()
        pipe.hdel(keys.game_players_key(), str(player_id))
        pipe.execute()
        return game_id

    def start_game(self, game_id, words, countdown=0, length=90):
        if self.get_game_status(game_id) not in [GameStatus.WAITING, GameStatus.SCHEDULED]:
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

        pipe = self.redis.pipeline()
        keys = RedisGameKeyIndex(game_id)
        pipe.set(keys.game_letters_key(), letters)
        pipe.sadd(keys.word_set_key(), *word_set)
        start_time = timezone.now() + timedelta(seconds=countdown)
        end_time = start_time + timedelta(seconds=length)
        pipe.set(keys.game_start_key(), start_time.isoformat())
        pipe.set(keys.game_start_timestamp_key(), int(start_time.timestamp()))
        pipe.set(keys.game_end_key(), end_time.isoformat())
        pipe.set(keys.game_end_timestamp_key(), int(end_time.timestamp()))
        pipe.rpush(keys.game_wc_key(), *word_count_arr)
        pipe.execute()

        return True

    def set_expiry(self, game_id, seconds):
        keys = RedisGameKeyIndex(game_id)
        pipe = self.redis.pipeline()
        for key in keys:
            pipe.expire(key, seconds)
        pipe.execute()

    def get_game_words(self, game_id):
        keys = RedisGameKeyIndex(game_id)
        words = self.redis.smembers(keys.word_set_key())
        return words

    def get_game_state(self, game_id):
        keys = RedisGameKeyIndex(game_id)
        pipe = self.redis.pipeline()
        pipe.hgetall(keys.game_players_key())
        pipe.hgetall(keys.used_words_set_key())
        pipe.get(keys.game_start_key())
        pipe.get(keys.game_end_key())
        pipe.get(keys.game_created_key())
        pipe.get(keys.game_letters_key())
        pipe.lrange(keys.game_wc_key(), 0, -1)
        res = pipe.execute()

        player_info = res[0]
        player_info_deserialized = {pid: json.loads(
            info_json) for (pid, info_json) in player_info.items()}

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


    def get_game_status(self, game_id):
        pipe = self.redis.pipeline()
        keys = RedisGameKeyIndex(game_id)
        pipe.get(keys.game_start_key())
        pipe.get(keys.game_end_key())
        res = pipe.execute()
        start = res[0]
        end = res[1]
        return derive_game_status(start, end)
    
    def _init_try_word_script(self):      
        lua_script = '''
            local stime = redis.call('GET', KEYS[3])
            local etime = redis.call('GET', KEYS[4])
            local nowtime = tonumber(ARGV[3])

            if not stime or not etime then return 0 end
            if nowtime < tonumber(stime) then return 0 end
            if nowtime >= tonumber(etime) then return 0 end

            local nrem = redis.call('SREM', KEYS[1], ARGV[1])
            if nrem > 0 then 
                redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
                return nrem
            else return nrem
            end
        '''
        self.try_word_script = self.redis.register_script(lua_script)
        return self.try_word_script

    def use_word(self, game_id, player_id, word):
        keys = RedisGameKeyIndex(game_id)
        res = self.try_word_script(
            keys=[keys.word_set_key(),
                keys.used_words_set_key(),
                keys.game_start_timestamp_key(),
                keys.game_end_timestamp_key()
                ],
            args=[word, str(player_id), int(timezone.now().timestamp())])

        if res == 1:
            return True
        else:
            return False

    def end_game(self, game_id):
        keys = RedisGameKeyIndex(game_id)
        self.redis.set(keys.game_end_key(), timezone.now().isoformat())

    def clean_up_game(self, game_id):
        pipe = self.redis.pipeline()
        keys = RedisGameKeyIndex(game_id)
        for k in self.redis.scan_iter(match=keys.game_key() + "*"):
            pipe.delete(k)
        pipe.execute()

    def update_player_name(self, game_id, player_id, new_name):
        keys = RedisGameKeyIndex(game_id)
        player_info = json.loads(r.hget(keys.game_players_key(), player_id))
        player_info['name'] = new_name
        self.redis.hset(keys.game_players_key(), player_id, json.dumps(player_info))
        return player_info
    

class RedisGameKeyIndex:
    
    keys = {
        'game_key': '{game_key}',
        'game_letters_key': '{game_key}:letters',
        'game_created_key': '{game_key}:created',
        'game_start_key': '{game_key}:start',
        'game_start_timestamp_key': '{game_key}:start_timestamp',
        'game_end_key': '{game_key}:end',
        'game_end_timestamp_key': '{game_key}:end_timestamp',
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

    def game_start_timestamp_key(self):
        return self.__key__('game_start_timestamp_key')

    def game_end_key(self):
        return self.__key__('game_end_key')

    def game_end_timestamp_key(self):
        return self.__key__('game_end_timestamp_key')

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
            

