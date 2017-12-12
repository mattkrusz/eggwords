import json
import uuid
from collections import defaultdict
from enum import Enum
from typing import DefaultDict, List, Mapping, Union

import dateutil.parser
from django.utils import timezone

from gamechannels.gameutils import *
from gamechannels.score import score_game


class GameStatus(Enum):
    WAITING   = 0
    SCHEDULED = 1
    PLAYING   = 2
    COMPLETED = 3

class GameState:
    def __init__(self,
                 game_id: Union[uuid.UUID, str],
                 player_info: Mapping[Union[uuid.UUID, str], Mapping],
                 used_words: Mapping[str, Union[uuid.UUID, str]],
                 start_time: str,      # isoformat
                 end_time: str,        # isoformat
                 created_time: str,    # isoformat
                 letters: str,         # e.g., 'spiders'
                 word_count: List[int] # e.g., [0,0,0,3,4,5,6,7]
                ) -> None:

        self.game_id = self._ensure_UUID(game_id)
        self.player_ids = set(self._ensure_UUID(pid) for pid in player_info.keys())
        self.player_info = { self._ensure_UUID(k):v for (k, v) in player_info.items() }
        self.used_words = list(used_words.keys())

        self.used_words_by_pid: DefaultDict[uuid.UUID, List[str]] = defaultdict(list)
        for (used_word, pid) in used_words.items():
            self.used_words_by_pid[self._ensure_UUID(pid)].append(used_word)

        self.start_time = start_time
        self.end_time = end_time
        self.created_time = created_time
        self.letters = letters
        self.word_count = word_count

    @staticmethod
    def _ensure_UUID(inp):
        if type(inp) is str:
            return uuid.UUID(inp)
        elif isinstance(inp, uuid.UUID):
            return inp
        else:
            raise Exception(f"Cannot convert {type(inp)} to UUID.")

    def words_for(self, player_id: Union[str, uuid.UUID]) -> List[str]:
        return self.used_words_by_pid[self._ensure_UUID(player_id)]

    def status(self) -> GameStatus:
        return self.status_at_time()

    def status_at_time(self, dtime=None) -> GameStatus:
        return derive_game_status(self.start_time, self.end_time, dtime)

    def score(self) -> Mapping[uuid.UUID, int]:
        return score_game(self)

    def json_dict(self):
        return {
            'gameId': str(self.game_id),
            'playerIds': [str(pid) for pid in self.player_ids],
            'playerInfo': {str(k):v for (k, v) in self.player_info.items()},
            'usedWords': {str(k):v for (k, v) in self.used_words_by_pid.items()},
            'wordCount': self.word_count,
            'startTime': self.start_time,
            'endTime': self.end_time,
            'letters': self.letters,
            'gameStatus': self.status_at_time().name,
            'score': {str(k):v for (k, v) in self.score().items()}
        }

    def exists(self) -> bool:
        return self.created_time is not None

    def __str__(self) -> str:
        return json.dumps(self.json_dict(), default=json_fallback)


def derive_game_status(start: str,
                       end: str,
                       at_time: str = None) -> GameStatus:

    if at_time is None:
        at_time_parsed = timezone.now()
    else:
        at_time_parsed = dateutil.parser.parse(at_time)

    if start and end:
        start_parsed = dateutil.parser.parse(start)
        end_parsed = dateutil.parser.parse(end)
        if at_time_parsed <= start_parsed:
            return GameStatus.SCHEDULED
        elif at_time_parsed < end_parsed:
            return GameStatus.PLAYING
        return GameStatus.COMPLETED

    return GameStatus.WAITING
