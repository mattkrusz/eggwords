import pytest
import uuid
import gamechannels.game as game_service

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
    game_service.clean_up_game(game_id)

def test_simple_game(game_id):
    print("Test game_id = " + str(game_id))
    
    p1_id = uuid.uuid4()
    p2_id = uuid.uuid4()
    
    game_service.init_game(game_id, [p1_id, p2_id], test_words)
    game_state = game_service.get_game_state(game_id)

    player_list = game_state.player_ids
    assert 2 == len(player_list)
    assert str(p1_id) in player_list
    assert str(p2_id) in player_list

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
    assert game_state.end_time is not None