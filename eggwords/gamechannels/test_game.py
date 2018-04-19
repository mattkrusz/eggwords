import os
import time
import typing
import uuid
from collections import Counter
from datetime import datetime, timedelta

import dateutil.parser
import pytest
from django.utils import timezone

import gamechannels.gameservice as gameservice
import gamechannels.score as score_service
from gamechannels.game import GameState, GameStatus
import gamechannels.gamealias as gamealias
from gamechannels.gameexceptions import *

game_service = gameservice.RedisGameService()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eggwords.settings.local_settings")

TEST_WORDS = ['spiders', 'diss', 'redips', 'eds', 'per', 'pes', 'speirs', 'sped', 'pride', 'psi', 'pied', 'rise',
              'reps', 'spires', 'prides', 'press', 'spired', 'pier', 'pies', 'resid', 'reis', 'die', 'ers', 'pries', 'pried',
              'dip', 'side', 'dis', 'sipe', 'dries', 'ser', 'peds', 'prises', 'spider', 'sips', 'sei', 'ides', 'ess', 'res',
              'rep', 'spire', 'siped', 'redip', 'rei', 'psis', 'ped', 'sipes', 'ire', 'red', 'piss', 'pisser', 'spier',
              'sris', 'dire', 'spied', 'rises', 'pissed', 'rids', 'sri', 'ids', 'reds', 'sire', 'sirs', 'resids',
              'peri', 'speir', 'dips', 'drips', 'spiers', 'seis', 'sers', 'riped', 'ride', 'ripes', 'peris', 'piers',
              'ripe', 'spies', 'pie', 'rip', 'rips', 'rid', 'pis', 'dress', 'sis', 'sir', 'sip', 'sired', 'priss',
              'prise', 'prised', 'rides', 'sires', 'dies', 'ires', 'ired', 'sides', 'drip']

TEST_WORD_COUNTER = Counter((len(w) for w in TEST_WORDS))
TEST_WORD_COUNT = [0] * (max((len(w) for w in TEST_WORDS)) + 1)
for (w_len, w_count) in TEST_WORD_COUNTER.items():
    TEST_WORD_COUNT[w_len] = w_count

@pytest.fixture(autouse=True, scope='function')
def game_id():
    game_id = uuid.uuid4()
    yield game_id
    # import pdb; pdb.set_trace()
    game_service.clean_up_game(game_id)

def test_simple_game(game_id):
    print("Test game_id = " + str(game_id))

    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    p2_id = uuid.uuid4()
    p2_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)

    game_state = game_service.get_game_state(game_id)
    assert GameStatus.WAITING == game_service.get_game_status(game_id)
    assert 1 == len(game_state.player_ids)
    assert p1_id in game_state.player_ids
    assert game_state.created_time is not None
    assert dateutil.parser.parse(game_state.created_time) < datetime.utcnow()

    game_service.add_player(game_id, p2_id, p2_token)

    game_state = game_service.get_game_state(game_id)
    assert GameStatus.WAITING == game_service.get_game_status(game_id)
    assert 2 == len(game_state.player_ids)
    assert p1_id in game_state.player_ids
    assert p2_id in game_state.player_ids

    result = game_service.use_word(game_id, p1_id, 'spiders')
    assert not result

    did_start = game_service.start_game(game_id, TEST_WORDS, countdown=1)
    assert did_start

    words = game_service.get_game_words(game_id)
    assert words is not None
    for test_word in TEST_WORDS:
        assert test_word in words

    game_state = game_service.get_game_state(game_id)
    assert GameStatus.SCHEDULED == game_service.get_game_status(game_id)
    assert len('spiders') == len(game_state.letters)
    for l in 'spiders':
        assert l in game_state.letters

    time.sleep(1)
    assert GameStatus.PLAYING == game_service.get_game_status(game_id)

    result = game_service.use_word(game_id, p1_id, 'spiders')
    assert result == True

    result2 = game_service.use_word(game_id, p2_id, 'spiders')
    assert result2 == False

    game_state = game_service.get_game_state(game_id)

    p1_words = game_state.words_for(p1_id)
    assert len(p1_words) == 1
    assert 'spiders' in p1_words

    p2_words = game_state.words_for(p2_id)
    assert len(p2_words) == 0

    game_service.end_game(game_id)
    game_state = game_service.get_game_state(game_id)
    assert GameStatus.COMPLETED == game_service.get_game_status(game_id)

def test_score() -> None:
    p1_id = uuid.uuid4()
    p2_id = uuid.uuid4()

    game_state0 = GameState(
        uuid.uuid4(),
        {p1_id: {}, p2_id: {}},
        {},
        (timezone.now() - timedelta(seconds=45)).isoformat(),
        (timezone.now() + timedelta(seconds=45)).isoformat(),
        (timezone.now() - timedelta(seconds=70)).isoformat(),
        'spiders',
        TEST_WORD_COUNT,
        (timezone.now() + timedelta(minutes=10)).isoformat()
    )

    score0 = score_service.score_game(game_state0)
    assert score0[p1_id] == score0[p2_id] == 0

    game_state1 = GameState(
        uuid.uuid4(),
        {p1_id: {}, p2_id: {}},
        {  'spiders': p1_id,
           'diss': p1_id,
           'redips': p1_id,
           'eds': p1_id,
           'per': p1_id,
           'pes': p1_id,
           'speirs': p1_id,
           'sped': p1_id,
           'pride': p1_id,
           'psi': p2_id,
           'pied': p2_id,
           'rise': p2_id,
           'reps': p2_id,
           'spires': p2_id,
           'prides': p2_id,
           'press': p2_id
        },
        (timezone.now() - timedelta(seconds=45)).isoformat(),
        (timezone.now() + timedelta(seconds=45)).isoformat(),
        (timezone.now() - timedelta(seconds=70)).isoformat(),
        'spiders',
        TEST_WORD_COUNT,
        (timezone.now() + timedelta(minutes=10)).isoformat()
    )

    score1 = score_service.score_game(game_state1)
    assert score1[p1_id] > score1[p2_id]

def test_expire(game_id):
    game_service.set_expire(game_id, 180)

def test_get_missing_game():
    game_state = game_service.get_game_state(uuid.uuid4())
    assert not game_state.exists()

def test_reinit_game(game_id):
    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    p2_id = uuid.uuid4()
    p2_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)
    game_service.add_player(game_id, p2_id, p2_token)
    game_service.start_game(game_id, TEST_WORDS)
    game_service.end_game(game_id)
    assert GameStatus.COMPLETED == game_service.get_game_status(game_id)

    game_service.reinit_game(game_id)
    gstate = game_service.get_game_state(game_id)
    assert GameStatus.WAITING == gstate.status()
    assert gstate.start_time is None
    assert gstate.end_time is None
    assert gstate.letters is None
    assert 0 == len(gstate.word_count)
    assert all(0 == v for k, v in gstate.score().items())
    assert 0 == len(gstate.used_words)

def test_player_info(game_id):
    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)
    game_service.update_player_name(game_id, p1_id, 'TestName', p1_token)
    gstate = game_service.get_game_state(game_id)
    assert 'TestName' == gstate.player_info[p1_id]['name']
    assert 'color' in gstate.player_info[p1_id]

def test_full_game(game_id):
    game_service.init_game(game_id, uuid.uuid4(), uuid.uuid4())
    for _ in range(gameservice.MAX_PLAYERS - 1):
        game_service.add_player(game_id, uuid.uuid4(), uuid.uuid4())
    with pytest.raises(GameFull):
        game_service.add_player(game_id, uuid.uuid4(), uuid.uuid4())
        game_service.add_player(game_id, uuid.uuid4(), uuid.uuid4())


def test_player_colors(game_id):
    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)
    game_service.update_player_name(game_id, p1_id, 'TestName', p1_token)

    p2_id, p2_token = uuid.uuid4(), uuid.uuid4()
    p3_id, p3_token = uuid.uuid4(), uuid.uuid4()
    p4_id, p4_token = uuid.uuid4(), uuid.uuid4()
    p5_id, p5_token = uuid.uuid4(), uuid.uuid4()

    game_service.add_player(game_id, p2_id, p2_token)
    game_service.add_player(game_id, p3_id, p3_token)
    game_service.add_player(game_id, p4_id, p4_token)
    game_service.add_player(game_id, p5_id, p5_token)

    gstate = game_service.get_game_state(game_id)

    # Assert all colors are unique
    used_colors = [pi['color'] for pi in gstate.player_info.values()]
    assert len(set(used_colors)) == len(used_colors)

    # Remove / Add player, then test again
    game_service.remove_player(game_id, p3_id)
    new_id, new_token = uuid.uuid4(), uuid.uuid4()
    game_service.add_player(game_id, new_id, new_token)

    gstate = game_service.get_game_state(game_id)
    used_colors = [pi['color'] for pi in gstate.player_info.values()]
    assert len(set(used_colors)) == len(used_colors)


def test_player_info_unauthorized(game_id):
    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)
    with pytest.raises(UnauthorizedAction):
        game_service.update_player_name(game_id, p1_id, 'TestName', None)
    with pytest.raises(UnauthorizedAction):
        game_service.update_player_name(game_id, p1_id, 'TestName', uuid.uuid4())

def test_game_alias(game_id) -> None:
    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)
    aliased = gamealias.create_game_alias(game_id)
    dealiased = gamealias.dealias_game(aliased)

    assert str(dealiased) == str(game_id)

def test_game_alias_missing(game_id) -> None:
    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)
    with pytest.raises(GameAliasNotFound):
        gamealias.dealias_game('abcdefg')

def test_start_missing_game(game_id) -> None:
    with pytest.raises(GameDoesNotExist):
        game_service.start_game(game_id, TEST_WORDS)

def test_double_start_game(game_id) -> None:
    p1_id = uuid.uuid4()
    p1_token = uuid.uuid4()

    game_service.init_game(game_id, p1_id, p1_token)
    game_service.start_game(game_id, TEST_WORDS)

    with pytest.raises(GameStatusException):
        game_service.start_game(game_id, TEST_WORDS)
