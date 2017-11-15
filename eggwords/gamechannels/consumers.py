from django.http import HttpResponse
from channels.handler import AsgiHandler
from channels import Group, Channel
from gamechannels.word_lists import word_lists
import gamechannels.game as game_service
from gamechannels.game import GameStatus
import uuid
import json
import random

DEFAULT_GAME_LENGTH = 120

def game_group_name(game_id):
    return 'game-' + str(game_id)

def ws_connect(message):
    print("ws_connect")
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
        'gameId': str(game_id), 
        'playerId': str(player_id)
    })
    
    message.reply_channel.send({"accept": True, "text":response})
    send_game_state(game_id)
    
    expiry = {
        'gameId': str(game_id), 
        'expire_after_seconds': 600        
    }
    Channel('game.expire').send(expiry)
    

def ws_joingame(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)    
    player_id = message.get("playerId")
    if not player_id:
        player_id = uuid.uuid4()
    Group(group_name).add(message['reply_channel'])    
    game_service.add_player(game_id, player_id)
    
    response = json.dumps({
        'type': 'JoinGameResponse',
        'gameId': message['gameId'], 
        'playerId': str(player_id)
    })

    message.reply_channel.send({"accept": True, "text":response})  
    send_game_state(game_id) 

    expiry = {
        'gameId': str(game_id), 
        'expire_after_seconds': 600        
    }
    Channel('game.expire').send(expiry)

def ws_reinitgame(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)    
    
    game_service.reinit_game(game_id)
    
    response = json.dumps({
        'type': 'ReinitGameResponse',
        'gameId': message['gameId']
    })

    message.reply_channel.send({"accept": True, "text":response})  

    reinit_msg = json.dumps({
        'type': 'GameReinitialized',
        'gameId': message['gameId']
    })
    Group(group_name).send({'text': reinit_msg})

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
    game_id = message['gameId']
    words = random.choice(word_lists)
    game_seconds = DEFAULT_GAME_LENGTH
    did_start = game_service.start_game(game_id, words, length = game_seconds)    

    if did_start:
        delayed_message = {
            'channel': 'game.end',
            'content': {'gameId': str(game_id)},
            'delay': (game_seconds+1) * 1000
        }
        Channel('asgi.delay').send(delayed_message, immediately=True)    

        send_game_state(game_id)

        expiry = {
            'gameId': str(game_id), 
            'expire_after_seconds': 120 + game_seconds     
        }
        Channel('game.expire').send(expiry)

def ws_end_game(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)
    if game_service.get_game_status(game_id) == GameStatus.COMPLETED:
        send_game_state(game_id)
        reveal_words(game_id)
    else:
        delayed_message = {
            'channel': 'game.end',
            'content': {'gameId': game_id},
            'delay': 1 * 1000
        }
        Channel('asgi.delay').send(delayed_message, immediately=True)       
 

def ws_submit_word(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)    
    player_id = message['playerId']    
    word = message['word']
    print("ws_submit_word", word)
    result = game_service.use_word(game_id, player_id, word)

    response = json.dumps({
        'type': 'SendWordResponse',
        'gameId': game_id, 
        'playerId': player_id,
        'word': word,
        'result':  'ACCEPT' if result else 'REJECT'
    })
    message.reply_channel.send({'text': response})      

    if result == True:         
        send_game_state(game_id)

def ws_expire_game(message):
    game_id = message['gameId']
    expire_after_seconds =  message.get('expire_after_seconds', 120)
    game_service.set_expiry(game_id, expire_after_seconds)

def reveal_words(game_id):
    group_name = game_group_name(game_id)
    game_words = game_service.get_game_words(game_id)
    response = json.dumps({
        'type': 'RevealWords',
        'gameId': game_id,
        'words': list(game_words)
    })
    Group(group_name).send({'text': response})

def ws_change_name(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)
    player_id = message['playerId']
    name = message['name']
    game_service.update_player_name(game_id, player_id, name)
    response = {
        'type': 'PlayerInfoUpdate',
        'gameId': game_id,
        'playerId': player_id,
        'info': {'name': name},
        'accept': True
    }
    Group(group_name).send({'text': json.dumps(response)})

# Connected to websocket.disconnect
def ws_disconnect(message):
    print("ws_disconnect")
    Group("chat").discard(message.reply_channel)
