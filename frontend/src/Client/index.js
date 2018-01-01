import { WebSocketBridge } from 'django-channels';
import Rx from 'rxjs/Rx';

class GameClient {

    constructor() {
        this.wsBridge = new WebSocketBridge();    
        this.rxSubject = new Rx.Subject();
        this.joinGameEvent = new Rx.BehaviorSubject();

        this.rxSubject.filter((e) => e.action.type === "NewGameResponse" 
                                      || e.action.type === "JoinGameResponse")
                      .subscribe((e) => {
                        this.joinGameEvent.next(e);
                      });

        this.gameId = null;
        this.playerId = null;
    }

    connect(wsConstructor) {
        let options = {}
        if (wsConstructor != undefined) {
            options.constructor = wsConstructor;
        }
        
        let connectPromise = new Promise((resolve, reject) => {   
            let wsAddr = process.env.REACT_APP_WEBSOCKET_ADDRESS;
            this.wsBridge.connect(wsAddr, undefined, options);
            this.wsBridge.listen(this.listen.bind(this));
            this.wsBridge.socket.addEventListener('open', 
                () => {
                    console.log("Websocket Connection Open");
                    resolve();
                });
        });
        
        return connectPromise;
    }

    joinGame(gameId, playerId) {
        console.log("joinGame");
        if (gameId == undefined) {
            console.log("Creating new game");
            this.wsBridge.send({'type': 'create_game', 
                'playerId': playerId})
        } else {
            console.log("Connecting to existing game");
            this.wsBridge.send({'type': 'join_game', 
                'gameId': gameId, 
                'playerId': playerId})
        }
    }

    listen(action, stream) {        
        this.rxSubject.next({
            action: action,
            stream: stream
        });        
    }
    
    startGame(gameId) {
        console.log("startGame");
        let outbound = {
            'gameId': gameId, 
		    'type': 'start_game'
	    };
	    this.send(outbound);        
    }

    reinitGame(gameId) {
        console.log("reinitGame");
        let outbound = {
            'gameId': gameId,
            'type': 'reinit_game'
        };
        this.send(outbound);     
    }

    sendWord(gameId, playerId, word) {
        console.log("sendWord", word);
        let outbound = {
            'gameId': gameId, 
            'type': 'submit_word',
            'word': word,
            'playerId': playerId
        };
        this.send(outbound);
    }

    changeName(gameId, playerId, payerToken, name) {
        console.log("changeName", name);
        let outbound = {
            'gameId': gameId,
            'type': 'change_name',
            'playerToken': payerToken,
            'playerId': playerId,
            'name': name           
        };
        this.send(outbound);        
    }

    send(msgObj) {
        console.log("sending", msgObj);
        this.wsBridge.send(msgObj);
    }
    
    observable() {
        return this.rxSubject;
    }

    onJoinGame() {
        return this.joinGameEvent.filter((e) => e != null);
    }

}

export default GameClient;