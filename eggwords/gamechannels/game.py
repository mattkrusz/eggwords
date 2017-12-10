import json, uuid, collections
from datetime import datetime, timedelta
from enum import Enum

import dateutil.parser
from django.utils import timezone

from gamechannels.score import score_game
from gamechannels.gameutils import *

class GameStatus(Enum):
    WAITING   = 0
    SCHEDULED = 1
    PLAYING   = 2
    COMPLETED = 3

class GameState:    
    def __init__(self, id, player_info, used_words, start_time, end_time, created_time, 
        letters, word_count):
        self.id = id
        self.player_ids = list(player_info.keys())
        self.player_info = player_info
        self.used_words_by_pid = used_words
        self.used_words = list(used_words.keys())

        # (Convenience) Denormalize the used words into a word list for each player.
        for pi in self.player_info.values():
            pi['words'] = []
        for (w, pid) in used_words.items():
            if pid in self.player_info:
                self.player_info[pid]['words'].append(w)

        self.start_time = start_time
        self.end_time = end_time
        self.created_time = created_time
        self.letters = letters
        self.word_count = word_count

    def words_for(self, player_id):
        player_id = str(player_id)
        return [w for w,p_id in self.used_words_by_pid.items() if player_id == p_id]

    def status(self):
        return self.status_at_time()

    def status_at_time(self, dtime=None):
        return derive_game_status(self.start_time, self.end_time, dtime)
    
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
    
def derive_game_status(start: str, end: str, at_time=None):
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

