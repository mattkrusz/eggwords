import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Game from './GameComponent';
import registerServiceWorker from './registerServiceWorker';
import Rx from 'rxjs/Rx';
import { Provider, connect } from 'react-redux';

import rootReducer from './Reducers';
import  * as Actions from './Actions';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import GameClient from './Client';
import EventAdapter from './Client/adapter';

const loggerMiddleware = createLogger({
    predicate: (getState, action) => {
        return action.type != 'TICK';
    }
});
const store = createStore(
    rootReducer,
    applyMiddleware(
      thunkMiddleware,
      loggerMiddleware 
    )
);

const gc = new GameClient();
const actionFactory = new Actions.ActionFactory(gc);
const adapter = new EventAdapter(gc, store);
let gameId = null;
let playerId = null;

gc.connect().then(() => {
    if (window.location.hash == '') {
        store.dispatch(actionFactory.playerCreatesGame());
    } else {
        gameId = window.location.hash.slice(1);
        store.dispatch(actionFactory.playerJoinsGame(null, gameId));
    }    
});

gc.onJoinGame().subscribe((e) => {
    gameId = e.action.gameId;
    playerId = e.action.playerId;
    window.history.pushState(null, null, '#' + gameId);
});

const mapStateToProps = state => {
    return {
      letters: state.game.localLetters,
      typed: state.player.typed,
      myWords: state.requests.acceptedWords.map((aw) => aw.word),
      usedWords: Object.keys(state.game.usedWords),
      timeRemaining: state.game.timeRemaining,
      players: state.game.playerIds,
      gameStatus: state.game.gameStatus
    }
  }
  
  const mapDispatchToProps = dispatch => {
    return {
      onStartClick: () => {
        dispatch(actionFactory.playerPushesStartGame(gameId, playerId));
      }
    }
  }
  
  const HookedUpGame = connect(
    mapStateToProps,
    mapDispatchToProps
  )(Game)

ReactDOM.render(
    <Provider store={store}>
        <HookedUpGame />
    </Provider>
, document.getElementById('root'));

registerServiceWorker();

document.addEventListener("keydown", (e) => {
    console.log(e);
    let c = e.keyCode;
    if (c >= 65 && c <= 90 ) {
        store.dispatch(actionFactory.typeLetter(e.key));
    } else {
        switch (c) {
            case 8:
                store.dispatch(actionFactory.backspace());
                break;
            case 32:
                store.dispatch(actionFactory.shuffleLetters());
                break;
            case 13:
                store.dispatch(actionFactory.playerEntersWord(gameId, playerId));
                break;
            default:
                break;                     
        }
    }
});

function tick() {
    store.dispatch(actionFactory.tick());
    setTimeout(tick, 400);
}
tick();