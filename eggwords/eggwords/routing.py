from channels.routing import route
from gamechannels.consumers import ws_submit_word, ws_receive, \
	ws_connect, ws_disconnect, ws_newgame, ws_joingame, \
	ws_start_game, ws_end_game, ws_expire_game

channel_routing = [
	route("websocket.connect", ws_connect,  path=r"^/ws/game/$"),    
    route("websocket.receive", ws_receive, path=r"^/ws/game"),
	route("game.receive", ws_newgame, type="create_game"),    
	route("game.receive", ws_joingame, type="join_game"),    
	route("game.receive", ws_submit_word, type="submit_word"),
	route("game.receive", ws_start_game, type="start_game"),
	route("game.end", ws_end_game),
	route("game.expire", ws_expire_game),
    route("websocket.disconnect", ws_disconnect),
]