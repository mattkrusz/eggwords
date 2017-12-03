from channels.routing import route
from gamechannels.consumers import ws_connect, ws_disconnect, ws_dispatch_game_message, \
	gamerecv_end_game, gamerecv_expire_game

channel_routing = [
	route("websocket.connect", ws_connect,  path=r"^/ws/game/$"),    
    route("websocket.receive", ws_dispatch_game_message, path=r"^/ws/game"),
	route("game.end", gamerecv_end_game),
	route("game.expire", gamerecv_expire_game),
    route("websocket.disconnect", ws_disconnect),
]
