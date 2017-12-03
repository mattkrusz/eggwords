from channels.routing import route
from gamechannels.consumers import ws_connect, ws_disconnect, ws_gamereceive, \
	gamerecv_newgame, gamerecv_joingame, gamerecv_start_game, gamerecv_end_game, \
	gamerecv_expire_game, gamerecv_reinitgame, gamerecv_change_name, gamerecv_submit_word

channel_routing = [
	route("websocket.connect", ws_connect,  path=r"^/ws/game/$"),    
    route("websocket.receive", ws_gamereceive, path=r"^/ws/game"),
	route("game.receive", gamerecv_newgame, type="create_game"),    
	route("game.receive", gamerecv_joingame, type="join_game"),    
	route("game.receive", gamerecv_reinitgame, type="reinit_game"),
	route("game.receive", gamerecv_submit_word, type="submit_word"),
	route("game.receive", gamerecv_start_game, type="start_game"),
	route("game.receive", gamerecv_change_name, type="change_name"),
	route("game.end", gamerecv_end_game),
	route("game.expire", gamerecv_expire_game),
    route("websocket.disconnect", ws_disconnect),
]