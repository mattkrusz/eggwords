from django.http import HttpResponse
from channels.handler import AsgiHandler
from channels import Group, Channel
import uuid
import json

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
    group_name = game_group_name(game_id)
    Group(group_name).add(message.reply_channel)
    response = json.dumps({'game_id': str(game_id)})
    message.reply_channel.send({"accept": True, "text":response})

def ws_joingame(message):
    group_name = game_group_name(message['game_id'])    
    Group(group_name).add(message['reply_channel'])    
    response = json.dumps({'game_id': message['game_id']})
    message.reply_channel.send({"accept": True, "text":response})   

def ws_submit_word(message):
    group_name = game_group_name(message['game_id'])
    response = json.dumps({'game_id': message['game_id'], 'msg': message['word']})
    Group(group_name).send({"text": response})

# Connected to websocket.disconnect
def ws_disconnect(message):
    print("ws_disconnect")
    Group("chat").discard(message.reply_channel)