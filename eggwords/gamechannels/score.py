import uuid
from typing import Mapping

SCORE_BY_LEN = [0, 0, 0, 250, 500, 750, 1000, 4500]

def score_game(game_state) -> Mapping[uuid.UUID, int]:
    score = dict(((pid, 0) for pid in game_state.player_ids))
    for (pid, words) in game_state.used_words_by_pid.items():
        for word in words:
            try:
                score[pid] = score.get(pid, 0) + SCORE_BY_LEN[len(word)]
            except IndexError:
                if len(word) > len(SCORE_BY_LEN):
                    score[pid] += SCORE_BY_LEN[-1]
                else:
                    score[pid] += SCORE_BY_LEN[0]
    return score
