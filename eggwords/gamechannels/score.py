SCORE_BY_LEN = [0, 0, 0, 250, 500, 750, 1000, 3000]

def score_game(game_state):
    score = dict(((pid, 0) for pid in game_state.player_ids))
    for (player_id, words) in game_state.used_words_by_pid.items():
        for word in words:
            try:
                score[player_id] = score.get(player_id, 0) + SCORE_BY_LEN[len(word)]
            except IndexError:
                if len(word) > len(SCORE_BY_LEN):
                    score[player_id] += SCORE_BY_LEN[-1]
                else:
                    score[player_id] += SCORE_BY_LEN[0]
    return score
