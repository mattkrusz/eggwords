
import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import rootReducer from '../Reducers/index';
import GameClient from './index';
import EventAdapter from './adapter';
import * as Actions from '../Actions';

import Html5WebSocket from 'html5-websocket';

export function newStore() {
    const loggerMiddleware = createLogger({
        colors: {
            title: false,
             prevState: false,
             action: false,
             nextState: false,
             error: false
        }
    });
    const store = createStore(
        rootReducer,
        applyMiddleware(
          thunkMiddleware, // lets us dispatch() functions
          loggerMiddleware // neat middleware that logs actions
        )
    );
    return store;
}

it('adapter works', (done) => {

    let store = newStore();
    let gc = new GameClient();
    let adapter = new EventAdapter(gc, store);
    let actionFactory = new Actions.ActionFactory(gc);

    let playerId = null;
    let gameId = null;

    gc.connect(Html5WebSocket).then(() => {
        store.dispatch(actionFactory.playerCreatesGame(playerId));
    });

    // The true test would be to verify that the events are actually firing...
    // I can see that they are, but how to verify programmatically?

    gc.observable()
        .filter((o) => o.action.type === "NewGameResponse")
        .subscribe((o) => {
            gameId = o.action.gameId;            
            playerId = o.action.playerId;
            store.dispatch(actionFactory.playerPushesStartGame(gameId, playerId));
    });

    // When the game starts, send 'spiders'
    gc.observable()
        .filter((o) => (o.action.type === "GameState"
                    && o.action.gameStatus === "PLAYING"))
        .first()
        .subscribe((o) => { 
            store.dispatch(actionFactory.playerEntersWord(gameId, playerId, 'spiders'));
    }); 
    
    // The resut should be 'ACCEPT'
    gc.observable()
        .filter((o) => (o.action.type === "SendWordResponse"
                    && o.action.word === "spiders"))
        .first()
        .subscribe((o) => {
            expect(o.action.result).toBe('ACCEPT');            
            store.dispatch(actionFactory.playerEntersWord(gameId, playerId, 'spiders'));
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

