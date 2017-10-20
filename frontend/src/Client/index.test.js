import GameClient from './index';
import EventAdapter from './adapter';

// Node doesn't include a global websocket 
import Html5WebSocket from 'html5-websocket';

it('works', (done) => {
    let playerId = null;
    let gameId = null;
    let gc = new GameClient(true);
    gc.connect(Html5WebSocket).then(() => {
        gc.joinGame();
    });

    gc.observable().subscribe((o) => {
        console.log("observed:", o);
    });

    gc.observable().filter((o) => o.action.type === "NewGameResponse")
        .subscribe((o) => {
            gameId = o.action.gameId;            
            playerId = o.action.playerId;
            gc.startGame(gameId);
        });

    // When the game starts, send 'spiders'
    gc.observable()
        .filter((o) => (o.action.type === "GameState"
                    && o.action.gameStatus === "PLAYING"))
        .first()
        .subscribe((o) => {    
            gc.sendWord(gameId, playerId, 'spiders');
        });       

    // The resut should be 'ACCEPT'
    gc.observable()
        .filter((o) => (o.action.type === "SendWordResponse"
                    && o.action.word === "spiders"))
        .first()
        .subscribe((o) => {
            expect(o.action.result).toBe('ACCEPT');            
            gc.sendWord(gameId, playerId, 'spiders');
    });  
    
    // The second response for 'spiders' should be 'REJECT'
    gc.observable()
        .filter((o) => (o.action.type === "SendWordResponse"
                     && o.action.word === "spiders"))
        .skip(1)
        .subscribe((o) => {
            expect(o.action.result).toBe('REJECT');
            done();
    }); 
        
});

