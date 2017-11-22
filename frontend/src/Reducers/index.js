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
		usedWords: {},
		startTime: null,
        endTime: null,
        timeRemaining: null,
        playerIds: [],
        playerInfo: {},
        revealedWords: null
	},
    action
  ) {
    switch (action.type) {      
      case ActionTypes.NEW_GAME:        
      case ActionTypes.JOIN_GAME:
        return Object.assign({}, state, {
            gameId: action.gameId
        });
        break;
      case ActionTypes.UPDATE_GAME_STATE:
        let newState = { 
            ...state, 
            ...action.gameState
        };
        if (action.gameState.endTime != null) {
            newState.endTimestamp = Date.parse(action.gameState.endTime)
        }
        return newState;
        break;
      case ActionTypes.UPDATE_PLAYER_INFO:
        return Object.assign({}, state, {
            playerInfo: { ...state.playerInfo,
                [action.playerId]: action.info,
            }
        });
        break;        
      case ActionTypes.REVEAL_WORDS:
        return Object.assign({}, state, {
            revealedWords: action.words
        });
        break;
      case ActionTypes.REINITIALIZE_GAME:
        return Object.assign({}, state, {
            revealedWords: null
        });
        break;        
      default:
        return state;
    }
}

function player(
    state = {
        playerId: null,
        typed: '',
        localLetters: null,
        notifyAccept: false,
        notifyReject: false,
        lastAccepted: null,
        lastRejected: null
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
        case ActionTypes.REINITIALIZE_GAME:
            return Object.assign({}, state, {
                typed: '',
                localLetters: null
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
                newState.localLetters = action.gameState.letters;
                return newState;
            } else {
                return state;
            }
            break;
        case ActionTypes.BACKSPACE:
        case ActionTypes.CLEAR_TYPED:
            return Object.assign({}, state, {
                typed: '',
                localLetters: state.typed + state.localLetters
            });
            break;
        case ActionTypes.SHUFFLE_LETTERS:
            let shuffled = shuffleString(state.localLetters);
            return Object.assign({}, state, {
                localLetters: shuffled
            });
        case ActionTypes.WORD_RESPONSE:
            if (action.result === 'ACCEPT') {
                return { ...state,
                    lastAccepted: action.word,
                    notifyAccept: true
                };
            } else if (action.result === 'REJECT') {
                return {
                    ...state,
                    lastRejected: action.word,
                    notifyReject: true
                };
            }
            break;
        case ActionTypes.END_RESPONSE_NOTIFICATION:
            return { ...state, 
                notifyAccept: false,
                notifyReject: false
            }            
        default:
            return state;
    }
}

function requests (
    state = {
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
      case ActionTypes.REINITIALIZE_GAME:
        return Object.assign({}, state, {
            acceptedWords: [],
            lastRejected: null,
            lastShuffle: null
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