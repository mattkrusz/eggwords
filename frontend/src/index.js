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
import RxActionMiddleware from './RxActionMiddleware';

let storage = window.localStorage;

/*
  Set up redux middleware and then create the redux store.
*/
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
      loggerMiddleware,
      rxMiddleware
    )
);

const gc = new GameClient();
const actionFactory = new Actions.ActionFactory(gc);
const adapter = new EventAdapter(gc, store);
let gameId = null;
let playerId = storage.getItem("playerId");
let playerName = storage.getItem("playerName");

gc.connect().then(() => {
    if (window.location.hash == '') {
        store.dispatch(actionFactory.playerCreatesGame(playerId));
    } else {
        gameId = window.location.hash.slice(1);
        store.dispatch(actionFactory.playerJoinsGame(playerId, gameId));
    }    
});

gc.onJoinGame().subscribe((e) => {
    console.log(e);
    gameId = e.action.gameId;
    playerId = e.action.playerId;
    storage.setItem("playerId", playerId)
    window.history.pushState(null, null, '#' + gameId);
    if (playerName != null) {
        store.dispatch(actionFactory.requestChangeName(gameId, playerId, playerName));
    }
});

const mapStateToProps = state => {
    let myPlayerId = playerId;
    let oppWords = Object.entries(state.game.usedWords)
        .filter(([word, playerId]) => playerId !== myPlayerId)
        .map(([word, playerId]) => word);

    let inputRPadding = state.game.letters ? state.game.letters.length : 7;
    let typed = state.player.typed.padEnd(inputRPadding, ' ');

    let players = state.game.playerIds.map((pId) => (
        {
            ...(state.game.playerInfo[pId] || {}),
            playerId: pId,
            score: state.game.score[pId]
        }
    ));

    return {
        letters: state.player.localLetters || '',
        typed: typed,
        myWords: state.requests.acceptedWords.map((aw) => aw.word),
        oppWords: oppWords,
        wordCount: state.game.wordCount || [],
        endTimestamp: state.game.endTimestamp,       
        myPlayerId: playerId,
        players: players,
        maxScore: 10000,
        gameStatus: state.game.gameStatus,
        revealedWords: state.game.revealedWords,
        notifyAccept: state.player.notifyAccept,
        notifyReject: state.player.notifyReject,
        lastAccepted: state.player.lastAccepted,
        lastRejected: state.player.lastRejected
    }
}
  
  const mapDispatchToProps = dispatch => {
    return {
      onStartClick: () => {
        dispatch(actionFactory.playerPushesStartGame(gameId, playerId));
      },
      onRestartClick: () => {
        dispatch(actionFactory.playerPushesRestartGame(gameId, playerId));
      },
      onNameChange: (n) => {
        storage.setItem("playerName", n);
        dispatch(actionFactory.requestChangeName(gameId, playerId, n));
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

localStorage.debug = '*';

// Use rxjs to "react" to game events outside of React.
let wordResponseStream = reduxActionStream
    .filter((action) => (action.type === Actions.WORD_RESPONSE));
let gamestateUpdateStream = reduxActionStream
    .filter((action) => (action.type === Actions.UPDATE_GAME_STATE));

// The usedWords part of the state is an object mapping (usedWord -> playerId) where playerId is
// the id of the player that used the word.
let usedWordsStream = gamestateUpdateStream
    .flatMap((action) => Rx.Observable.from(Object.entries(action.gameState.usedWords)))
    .distinct((kv) => kv[0]);
let myUsedWordsStream = usedWordsStream
    .filter((kv) => kv[1] === playerId);
let opponentUsedWordsStream = usedWordsStream
    .filter((kv) => kv[1] !== playerId);

myUsedWordsStream.subscribe((kv) => {
    console.log(kv);
});

opponentUsedWordsStream.subscribe((kv) => {
    console.log(kv);
});

// Sounds
wordResponseStream.subscribe((a) => {
        // TODO - This should be a general system for hooking game events.
        if (a.result === 'REJECT') {
            let audio = document.getElementById("audio-reject-naw");
            audio.pause();
            audio.currentTime = 0;
            audio.play();
        } else {
            let audio = document.getElementById("audio-accept");
            audio.pause();
            audio.currentTime = 0;
            audio.play();  
        }
    }
);



