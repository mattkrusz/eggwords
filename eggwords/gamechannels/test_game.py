import pytest
import uuid
from gamechannels.game import GameState

test_words = ['spiders','diss','redips','eds','per','pes','speirs','sped','pride','psi','pied','rise',
    'reps','spires','prides','press','spired','pier','pies','resid','reis','die','ers','pries','pried',
    'dip','side','dis','sipe','dries','ser','peds','prises','spider','sips','sei','ides','ess','res',
    'rep','spire','siped','redip','rei','psis','ped','sipes','ire','red','piss','pisser','spier',
    'sris','dire','spied','rises','pissed','rids','sri','ids','reds','sire','sirs','resids',
    'peri','speir','dips','drips','spiers','seis','sers','riped','ride','ripes','peris','piers',
    'ripe','spies','pie','rip','rips','rid','pis','dress','sis','sir','sip','sired','priss',
    'prise','prised','rides','sires','dies','ires','ired','sides','drip']

@pytest.fixture(autouse=True, scope='function')
def game_id():
    game_id = uuid.uuid4()
    yield game_id
    # import pdb; pdb.set_trace()
    GameState(game_id).clean_up()

def test_new_game(game_id):
    print("Test game_id = " + str(game_id))
    
    p1_id = uuid.uuid4()
    p2_id = uuid.uuid4()
    
    game_state = GameState(game_id)
    game_state.init_game(test_words, [p1_id, p2_id])

    player_list = game_state.players()
    assert 2 == len(player_list)
    assert str(p1_id) in player_list
    assert str(p2_id) in player_list

    result = game_state.use_word(p1_id, 'spiders')
    assert result == True

    result2 = game_state.use_word(p2_id, 'spiders')
    assert result2 == False

    p1_words = game_state.player_words(p1_id)
    assert len(p1_words) == 1
    assert 'spiders' in p1_words

    p2_words = game_state.player_words(p2_id)
    assert len(p2_words) == 0
