import pytest
import uuid
import gamechannels.game as game_service
import gamechannels.score as score_service
import dateutil.parser
from datetime import datetime, timedelta
from django.utils import timezone
from gamechannels.game import GameStatus, GameState
from collections import Counter
import time, os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eggwords.settings")

test_words = ['spiders','diss','redips','eds','per','pes','speirs','sped','pride','psi','pied','rise',
    'reps','spires','prides','press','spired','pier','pies','resid','reis','die','ers','pries','pried',
    'dip','side','dis','sipe','dries','ser','peds','prises','spider','sips','sei','ides','ess','res',
    'rep','spire','siped','redip','rei','psis','ped','sipes','ire','red','piss','pisser','spier',
    'sris','dire','spied','rises','pissed','rids','sri','ids','reds','sire','sirs','resids',
    'peri','speir','dips','drips','spiers','seis','sers','riped','ride','ripes','peris','piers',
    'ripe','spies','pie','rip','rips','rid','pis','dress','sis','sir','sip','sired','priss',
    'prise','prised','rides','sires','dies','ires','ired','sides','drip']

test_word_counter = Counter((len(w) for w in test_words))
test_word_count = [0] * (max((len(w) for w in test_words)) + 1)
for (w_len, w_count) in test_word_counter.items():
    test_word_count[w_len] = w_count

@pytest.fixture(autouse=True, scope='function')
def game_id():
    game_id = uuid.uuid4()
    yield game_id
    # import pdb; pdb.set_trace()
    game_service.clean_up_game(game_id)

def test_simple_game(game_id):
    print("Test game_id = " + str(game_id))
    
    p1_id = uuid.uuid4()
    p2_id = uuid.uuid4()
    
    game_service.init_game(game_id, [p1_id])

    game_state = game_service.get_game_state(game_id)
    assert GameStatus.WAITING == game_service.get_game_status(game_id)
    assert 1 == len(game_state.player_ids)
    assert str(p1_id) in game_state.player_ids
    assert game_state.created_time is not None
    assert dateutil.parser.parse(game_state.created_time) < datetime.utcnow()   

    game_service.add_player(game_id, p2_id)

    game_state = game_service.get_game_state(game_id)
    assert GameStatus.WAITING == game_service.get_game_status(game_id)
    assert 2 == len(game_state.player_ids)
    assert str(p1_id) in game_state.player_ids
    assert str(p2_id) in game_state.player_ids

    result = game_service.use_word(game_id, p1_id, 'spiders')
    assert result == False

    did_start = game_service.start_game(game_id, test_words, countdown = 1)
    assert did_start

    words = game_service.get_game_words(game_id)
    assert words is not None
    for t in test_words:
        assert t in words

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

def test_score():
    p1_id = uuid.uuid4()
    p2_id = uuid.uuid4()

    game_state0 = GameState(
        uuid.uuid4(),
        [p1_id, p2_id],
        { },
        (timezone.now() - timedelta(seconds=45)).isoformat(),
        (timezone.now() + timedelta(seconds=45)).isoformat(),
        (timezone.now() - timedelta(seconds=70)).isoformat(),
        'spiders',
        test_word_count
    )

    score0 = score_service.score_game(game_state0)
    assert score0[p1_id] == score0[p2_id] == 0

    game_state1 = GameState(
        uuid.uuid4(), 
        [p1_id, p2_id],     
        {  'spiders': p1_id,
           'diss': p1_id,
           'redips': p1_id,
           'eds': p1_id,
           'per': p1_id,
           'pes': p1_id,
           'speirs': p1_id,
           'sped': p1_id,
           'pride': p1_id,
           'psi': p2_id ,
           'pied': p2_id ,
           'rise': p2_id ,            
           'reps': p2_id ,
           'spires': p2_id ,
           'prides': p2_id ,
           'press': p2_id 
        },
        (timezone.now() - timedelta(seconds=45)).isoformat(),
        (timezone.now() + timedelta(seconds=45)).isoformat(),
        (timezone.now() - timedelta(seconds=70)).isoformat(),
        'spiders',
        test_word_count
    )
    
    score1 = score_service.score_game(game_state1)
    assert score1[p1_id] > score1[p2_id]

def test_expire(game_id):
    game_service.set_expiry(game_id, 180)

def test_get_missing_game():
    game_state = game_service.get_game_state(uuid.uuid4())
    assert not game_state.exists()
