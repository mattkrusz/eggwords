from django.http import HttpResponse
from channels.handler import AsgiHandler
from channels import Group, Channel
import gamechannels.game as game_service
from gamechannels.game import GameStatus
import uuid
import json

test_words = ['spiders','diss','redips','eds','per','pes','speirs','sped','pride','psi','pied','rise',
    'reps','spires','prides','press','spired','pier','pies','resid','reis','die','ers','pries','pried',
    'dip','side','dis','sipe','dries','ser','peds','prises','spider','sips','sei','ides','ess','res',
    'rep','spire','siped','redip','rei','psis','ped','sipes','ire','red','piss','pisser','spier',
    'sris','dire','spied','rises','pissed','rids','sri','ids','reds','sire','sirs','resids',
    'peri','speir','dips','drips','spiers','seis','sers','riped','ride','ripes','peris','piers',
    'ripe','spies','pie','rip','rips','rid','pis','dress','sis','sir','sip','sired','priss',
    'prise','prised','rides','sires','dies','ires','ired','sides','drip']

def game_group_name(game_id):
    return 'game-' + str(game_id)

def ws_connect(message):
    message.reply_channel.send({"accept": True})

def ws_receive(message):
    payload = json.loads(message['text'])
    payload['reply_channel'] = message.content['reply_channel']
    Channel("game.receive").send(payload)

def ws_newgame(message):
    game_id = uuid.uuid4()
    player_id = message.get("player_id")
    if not player_id:
        player_id = uuid.uuid4()
    group_name = game_group_name(game_id)
    Group(group_name).add(message.reply_channel)
    game_service.init_game(game_id, [player_id])
    response = json.dumps({
        'type': 'NewGameResponse',
        'game_id': str(game_id), 
        'player_id': str(player_id)
    })
    
    message.reply_channel.send({"accept": True, "text":response})

def ws_joingame(message):
    game_id = message['game_id']
    group_name = game_group_name(game_id)    
    player_id = message.get("player_id")
    if not player_id:
        player_id = uuid.uuid4()
    Group(group_name).add(message['reply_channel'])    
    game_service.add_player(game_id, player_id)
    
    response = json.dumps({
        'type': 'JoinGameResponse',
        'game_id': message['game_id'], 
        'player_id': str(player_id)
    })

    message.reply_channel.send({"accept": True, "text":response})  

    send_game_state(game_id) 

def send_game_state(game_id, game_state=None):
    group_name = game_group_name(game_id)

    if game_state is None:
        game_state = game_service.get_game_state(game_id)

    game_state_resp = {
        'type': 'GameState',
        **game_state.json_dict()
    }

    Group(group_name).send({'text': json.dumps(game_state_resp)})    

def ws_start_game(message):
    game_id = message['game_id']
    did_start = game_service.start_game(game_id, test_words, length = 90)    

    delayed_message = {
        'channel': 'game.end',
        'content': {'game_id': game_id},
        'delay': 91 * 1000
    }
    Channel('asgi.delay').send(delayed_message, immediately=True)    

    send_game_state(game_id)

def ws_end_game(message):
    game_id = message['game_id']
    group_name = game_group_name(game_id)
    if game_service.get_game_status(game_id) == GameStatus.COMPLETED:
        send_game_state(game_id)
    else:
        delayed_message = {
            'channel': 'game.end',
            'content': {'game_id': game_id},
            'delay': 1 * 1000
        }
        Channel('asgi.delay').send(delayed_message, immediately=True)       
 

def ws_submit_word(message):
    game_id = message['game_id']
    group_name = game_group_name(game_id)    
    player_id = message['player_id']    
    word = message['word']
    result = game_service.use_word(game_id, player_id, word)

    response = json.dumps({
        'type': 'SendWordResponse',
        'game_id': game_id, 
        'player_id': player_id,
        'word': word,
        'result':  'ACCEPT' if result else 'REJECT'
    })
    message.reply_channel.send({'text': response})      

    if result == True:         
        send_game_state(game_id)
 

# Connected to websocket.disconnect
def ws_disconnect(message):
    print("ws_disconnect")
    Group("chat").discard(message.reply_channel)