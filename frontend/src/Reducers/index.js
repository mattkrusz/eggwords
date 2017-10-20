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
        let newState = Object.assign({}, state, action.gameState);
        if (state.localLetters == null) {
            newState.localLetters = newState.letters;
        }
        return newState;
        break;
      case ActionTypes.SHUFFLE_LETTERS:
        let shuffled = shuffleString(state.letters);
        return Object.assign({}, state, {
            localLetters: shuffled
        });    
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
        return Object.assign({}, state, {
            typed: state.typed + action.letter
        });
        break;
      case ActionTypes.BACKSPACE:
        let s = state.typed;
        return Object.assign({}, state, {
            typed: s.slice(0, s.length > 0 ? s.length - 1 : 0)
        });
        break;   
      case ActionTypes.CLEAR_TYPED:
        return Object.assign({}, state, {
            typed: ''
        });
        break;                       
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