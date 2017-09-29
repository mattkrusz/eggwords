from channels.routing import route
from gamechannels.consumers import ws_submit_word, ws_receive, ws_connect, ws_disconnect, ws_newgame, ws_joingame

channel_routing = [
	route("websocket.connect", ws_connect,  path=r"^/ws/game/$"),    
    route("websocket.receive", ws_receive, path=r"^/ws/game"),
	route("game.receive", ws_newgame, type="create_game"),    
	route("game.receive", ws_joingame, type="join_game"),    
	route("game.receive", ws_submit_word, type="submit_word"),  
    route("websocket.disconnect", ws_disconnect),
]