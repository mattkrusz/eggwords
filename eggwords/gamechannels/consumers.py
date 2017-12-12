import uuid, json, random, re
from functools import wraps

from django.http import HttpResponse
from channels.handler import AsgiHandler
from channels.message import Message
from channels import Group, Channel
from channels.sessions import channel_session

from gamechannels.word_lists import word_lists
import gamechannels.gameservice as gameservice
from gamechannels.game import GameStatus
from gamechannels.gamealias import create_game_alias, dealias_game
from gamechannels.models import WordSet

DEFAULT_GAME_LENGTH = 120

game_service = gameservice.RedisGameService()

re_uuid4 = re.compile('[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}')

def game_group_name(game_id):
    return 'game-' + str(game_id)    

def decode_json_message(func):
    '''
    Decorator for Django Channels consumer methods that decodes the message text as json.
    
    Also takes all the attributes of that json and raises them to be attributes on the message's content dict. 
    '''
    @wraps(func)
    def wrapped(*args, **kwargs):     
        msg = args[0]              
        decoded_json = json.loads(msg.get('text'))
        new_content = { **msg.content, **decoded_json }
        processed_msg = Message(new_content, msg.channel.name, msg.channel_layer)
        return func(processed_msg, **kwargs)
    return wrapped
        
# Manage connecting / disconnecting via websocket

def ws_connect(message):
    '''
    Django Channels consumer method that consumes messages on the websocket.connect channel.    
    '''
    message.reply_channel.send({"accept": True})

@channel_session
def ws_disconnect(message):
    '''
    Django Channels consumer method that consumes messages on the websocket.disconnect channel.
    '''

    # Remove the player from (1) the game's group and (2) the game state.
    game_id = message.channel_session.get("gameId")
    player_id = message.channel_session.get("playerId")
    if game_id:
        group_name = game_group_name(game_id)
        Group(group_name).discard(message.reply_channel)
        if player_id:
            game_service.remove_player(game_id, player_id)

# Route game messages.

@decode_json_message
def ws_dispatch_game_message(msg):    
    '''
    Django Channels consumer method that receives game messages and dispatches them
    to the appropriate handler method.
    '''
    fn = dispatch.get(msg.get('type', 'unknown'), gamerecv_unknown_type)
    return fn(msg)

# Consume game messages.

@channel_session
def gamerecv_newgame(message):
    game_id = uuid.uuid4()
    player_id = message.get("playerId") or uuid.uuid4()
    player_token = message.get("playerToken") or uuid.uuid4()

    group_name = game_group_name(game_id)
    Group(group_name).add(message.reply_channel)
    
    game_service.init_game(game_id, player_id, player_token)    
    alias = create_game_alias(game_id)

    response = json.dumps({
        'type': 'NewGameResponse',
        'gameId': str(game_id),
        'alias': str(alias),
        'playerId': str(player_id),
        'playerToken': str(player_token),
    })
    
    message.reply_channel.send({"accept": True, "text":response})
    message.channel_session["gameId"] = str(game_id)
    message.channel_session["playerId"] = str(player_id)
    send_game_state(game_id)
    
    expiry = {
        'gameId': str(game_id), 
        'expire_after_seconds': 600        
    }
    Channel('game.expire').send(expiry)
    
@channel_session
def gamerecv_joingame(message):
    game_id = message['gameId']
    alias = None
    if not re_uuid4.match(game_id):
        alias = game_id
        game_id = dealias_game(game_id)
        # TODO: if it doesn't exist ...
    group_name = game_group_name(game_id)    
    player_id = message.get("playerId") or uuid.uuid4()
    player_token = message.get("playerToken") or uuid.uuid4()
    Group(group_name).add(message['reply_channel'])    
    game_service.add_player(game_id, player_id, player_token)
    message.channel_session["gameId"] = str(game_id)
    message.channel_session["playerId"] = str(player_id)
    
    response = json.dumps({
        'type': 'JoinGameResponse',
        'gameId': game_id,
        'alias': alias,
        'playerId': str(player_id),
        'playerToken': str(player_token),
    })

    message.reply_channel.send({"accept": True, "text":response})  
    send_game_state(game_id) 

    expiry = {
        'gameId': str(game_id), 
        'expire_after_seconds': 600        
    }
    Channel('game.expire').send(expiry)

def gamerecv_start_game(message):
    game_id = message['gameId']
    word_set = WordSet.objects.random()
    words = [w.word for w in word_set.words.all()]
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

def gamerecv_submit_word(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)    
    player_id = message['playerId']    
    word = message['word']
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

def gamerecv_expire_game(message):
    game_id = message['gameId']
    expire_after_seconds =  message.get('expire_after_seconds', 120)
    game_service.set_expiry(game_id, expire_after_seconds)


def gamerecv_end_game(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)
    game_state = game_service.get_game_state(game_id)
    attempt_num = message.get('attempt_num', 0)
    if game_state.status() == GameStatus.COMPLETED:
        send_game_state(game_id)
        send_reveal_words(game_id)
        game_service.set_expiry(game_id, 120)
    elif attempt_num < 9:
        delayed_message = {
            'channel': 'game.end',
            'content': {'gameId': game_id, 'attempt_num': attempt_num + 1},
            'delay': 1 * 1000
        }
        Channel('asgi.delay').send(delayed_message)


def gamerecv_reinitgame(message):
    game_id = message['gameId']
    group_name = game_group_name(game_id)

    game_service.reinit_game(game_id)

    response = json.dumps({
        'type': 'ReinitGameResponse',
        'gameId': message['gameId']
    })

    message.reply_channel.send({"accept": True, "text": response})

    reinit_msg = json.dumps({
        'type': 'GameReinitialized',
        'gameId': message['gameId']
    })
    Group(group_name).send({'text': reinit_msg})

    send_game_state(game_id)

def gamerecv_change_name(message):
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

def gamerecv_unknown_type(message):
    pass

# Re-usable convenience methods that send game data as websocket messages to the game's players.

def send_game_state(game_id, game_state=None):
    group_name = game_group_name(game_id)

    if game_state is None:
        game_state = game_service.get_game_state(game_id)

    game_state_resp = {
        'type': 'GameState',
        **game_state.json_dict()
    }

    Group(group_name).send({'text': json.dumps(game_state_resp)})

def send_reveal_words(game_id):
    group_name = game_group_name(game_id)
    game_words = game_service.get_game_words(game_id)
    response = json.dumps({
        'type': 'RevealWords',
        'gameId': game_id,
        'words': list(game_words)
    })
    Group(group_name).send({'text': response})
    
# Dict for dispatching game messages to consumers.

dispatch = {
    "create_game": gamerecv_newgame,
   	"join_game": gamerecv_joingame,
   	"reinit_game": gamerecv_reinitgame,
   	"submit_word": gamerecv_submit_word,
   	"start_game": gamerecv_start_game,
   	"change_name": gamerecv_change_name,
}
