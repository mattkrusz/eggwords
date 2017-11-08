import * as ActionTypes from '../Actions';

import { combineReducers } from 'redux';

function shuffleString(s) {
    let a = s.split('');
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
	return a.join('');
}


function game (
    state = {
		gameId: null,
		gameStatus: null,
        letters: '',
        localLetters: null,
		usedWords: {},
		startTime: null,
        endTime: null,
        timeRemaining: null,
        playerIds: [],
        revealedWords: null
	},
    action
  ) {
    switch (action.type) {
      case ActionTypes.TICK:
        let d = Date.parse(state.endTime);
        let n = Date.now();
        let s = (d - n) / 1000;
        s = parseInt(s);
        return Object.assign({}, state, {
            timeRemaining: s
        });        
        break;
      case ActionTypes.NEW_GAME:        
      case ActionTypes.JOIN_GAME:
        return Object.assign({}, state, {
            gameId: action.gameId
        });
        break;
      case ActionTypes.UPDATE_GAME_STATE:
        return Object.assign({}, state, action.gameState);
        break;
      case ActionTypes.REVEAL_WORDS:
        return Object.assign({}, state, {
            revealedWords: action.words
        });
        break;
      default:
        return state;
    }
}

function player (
    state = {
        playerId: null,
        typed: ''
	},
    action
  ) {
    switch (action.type) {
      case ActionTypes.NEW_GAME:        
      case ActionTypes.JOIN_GAME:
        return Object.assign({}, state, {
            playerId: action.playerId,
        });
        break;
      case ActionTypes.ENTER_LETTER:
        let ls = state.localLetters;
        let x = ls.indexOf(action.letter);
        return Object.assign({}, state, {
            typed: state.typed + action.letter,
            localLetters: ls.slice(0, x) + ls.slice(x + 1)
        });
        break;
      case ActionTypes.UPDATE_GAME_STATE:
        if (state.localLetters == null 
                && action.gameState.letters != null) {
            let newState = Object.assign({}, state);
            if (state.localLetters == null) {
                newState.localLetters = action.gameState.letters;
            }
            return newState;
        } else {
            return state;
        }
        break;        
      case ActionTypes.BACKSPACE:
        let t = state.typed;        
        if (t != null && t.length > 0) {
            let last = t[t.length - 1];
            let ls = state.localLetters;
            return Object.assign({}, state, {
                typed: t.slice(0, t.length > 0 ? t.length - 1 : 0),
                localLetters: ls + last
            });
        } else {
            return state;
        }    
        break;   
      case ActionTypes.CLEAR_TYPED:
        return Object.assign({}, state, {
            typed: '',
            localLetters: state.localLetters + state.typed
        });
        break;   
      case ActionTypes.SHUFFLE_LETTERS:
        let shuffled = shuffleString(state.localLetters);
        return Object.assign({}, state, {
            localLetters: shuffled
        });                              
      default:
        return state;
    }
}

function requests (
    state = {
        requestsOutstanding: false,
        acceptedWords: [],
        lastRejected: null,
        lastShuffle: null
	},
    action
    ) {
    switch (action.type) {    
      case ActionTypes.WORD_RESPONSE:
        if (action.result === 'ACCEPT') {
            return Object.assign({}, state, {
                acceptedWords: [...state.acceptedWords,
                    {
                        word: action.word,
                        time: action.receivedAt
                    }]
            });
        } else if (action.result === 'REJECT') {
            return Object.assign({}, state, {
                lastRejected: {
                        word: action.word,
                        time: action.receivedAt
                }
            });
        }
        break;
      case ActionTypes.SHUFFLE_LETTERS:
        return Object.assign({}, state, {
            lastShuffle: action.receivedAt
        });
        break;
      default:
        return state;
    }
}  

const rootReducer = combineReducers({
    game,
    player,
    requests
});

export default rootReducer;