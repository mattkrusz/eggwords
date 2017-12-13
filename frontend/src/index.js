import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import createContainerComponent from './GameContainerComponent';
import GameSound from './Sounds'
import Rx from 'rxjs/Rx';
import { Provider } from 'react-redux';

import rootReducer from './Reducers';
import  * as Actions from './Actions';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import GameClient from './Client';
import EventAdapter from './Client/adapter';
import RxActionMiddleware from './ReduxMiddleware/RxActionMiddleware';

let storage = window.localStorage;

/*
  Set up redux middleware and then create the redux store.
*/

// Set up a simple, custom rx middleware, used only for 
// _consuming_ redux actions as a stream.
const rxMiddleware = RxActionMiddleware();
let reduxActionStream = rxMiddleware.observable;

const loggerMiddleware = createLogger({
    predicate: (getState, action) => {
        return true;
    }
});

const store = createStore(
    rootReducer,
    applyMiddleware(
      thunkMiddleware,
      // loggerMiddleware,
      rxMiddleware
    )
);

/*
  Initialize other critical components.
*/

// GameClient for making / receiving messages over a websocket connection.
const gc = new GameClient();

// ActionFactory for dispatching actions, including making asynchronous
// calls based on them using the GameClient inside of "thunks."
const actionFactory = new Actions.ActionFactory(gc);

// EventAdapter that subscribes to messages received by the
// GameClient, and converts them to redux events.
const adapter = new EventAdapter(gc, store);

/*
  Hook up our GameReduxContainer to the store and render.
*/
let GameReduxContainer = createContainerComponent(actionFactory);
ReactDOM.render(
    <Provider store={store}>
        <GameReduxContainer/>
    </Provider>
    , document.getElementById('root'));


// A few variables that are used in the game initalization below.
let gameId = null;
let playerId = storage.getItem("playerId");
let playerName = storage.getItem("playerName");

// When the GameClient connects, either create a game or join a game.
gc.connect().then(() => {
    if (window.location.hash == '') {
        store.dispatch(actionFactory.playerCreatesGame(playerId));
    } else {
        gameId = window.location.hash.slice(1);
        store.dispatch(actionFactory.playerJoinsGame(playerId, gameId));
    }    
});

// When the GameClient joins/creates a game, save the information
// sent out by the server.
gc.onJoinGame().subscribe((e) => {
    console.log(e);
    gameId = e.action.gameId;
    playerId = e.action.playerId;
    storage.setItem("playerId", playerId)
    if (e.action.alias != undefined) {
        window.history.pushState(null, null, '#' + e.action.alias);
    } else {
        window.history.pushState(null, null, '#' + gameId);
    }
    
    if (playerName != null) {
        store.dispatch(actionFactory.requestChangeName(gameId, playerId, playerName));
    }
});

// Handle user input and dispatch it as redux actions.
document.addEventListener("keydown", (e) => {
    if(e.target.tagName === 'BODY' 
        && !e.metaKey
        && !e.altKey
        && !e.ctrlKey
        && !e.shiftKey) {
        e.preventDefault();
        let c = e.keyCode;
        if (c >= 65 && c <= 90) {
            store.dispatch(actionFactory.typeLetter(e.key));
        } else {
            switch (c) {
                case 8: // Backspace
                    store.dispatch(actionFactory.backspace());
                    break;
                case 32: // Space
                    store.dispatch(actionFactory.shuffleLetters());
                    break;
                case 13: // Enter
                    store.dispatch(actionFactory.playerEntersWord(gameId, playerId));
                    break;
                default:
                    break;
            }
        }
    }    
});

// Initialize the GameSound with the stream of redux actions that
// it responds to.
let gameSound = new GameSound(reduxActionStream, playerId);