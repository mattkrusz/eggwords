
export const NEW_GAME = 'NEW_GAME';
export const JOIN_GAME = 'JOIN_GAME';
export const UPDATE_GAME_STATE = 'UPDATE_GAME_STATE';

// These are just game states:
// export const GAME_END = 'GAME_END';
// export const GAME_START = 'GAME_START';

export const RECEIVE_GAME_STATE  = 'RECEIVE_GAME_STATE ';
export const USER_SUBMIT_WORD = 'USER_SUBMIT_WORD';
export const REQUEST_WORD = 'REQUEST_WORD';
export const WORD_RESPONSE = 'WORD_RESPONSE';
export const ACCEPT_WORD = 'ACCEPT_WORD';
export const REJECT_WORD = 'REJECT_WORD';
export const ENTER_LETTER = 'ENTER_LETTER';
export const REJECT_LETTER = 'REJECT_LETTER';
export const BACKSPACE = 'BACKSPACE';
export const CLEAR_TYPED = 'CLEAR_TYPED';
export const SHUFFLE_LETTERS = 'SHUFFLE_LETTERS';
export const TICK = 'TICK';

// Probably also need: SHUFFLE

export class ActionFactory {
    constructor(gameClient) {
        this.gameClient = gameClient;        
    }

    tick(timeLeft) {
        return {
            type: TICK
        }
    }

    newGame(gameId, playerId) {
        return {
            type: NEW_GAME,
            gameId: gameId,
            playerId: playerId,
            receivedAt: Date.now()
          }
    }

    joinGame(gameId, playerId) {
        return {
            type: NEW_GAME,
            gameId: gameId,
            playerId: playerId,
            receivedAt: Date.now()
          }
    }

    enterLetter(letter) {
        return {
            type: ENTER_LETTER,
            letter: letter
        }
    }

    rejectLetter(letter) {
        return {
            type: REJECT_LETTER,
            letter: letter
        }
    }

    backspace() {
        return {
            type: BACKSPACE
        }
    }

    clearTyped() {
        return {
            type: CLEAR_TYPED
        }
    }

    typeLetter(letter) {
        return (dispatch, getState) => {
            const { game, player } = getState();
            let counter = {};
            game.letters.split('').reduce((total, nxt) => {
                total[nxt] ? total[nxt]++ : total[nxt] = 1;
                return total;
            }, counter);

            let typed = player.typed + letter;   

            typed.split('').reduce((total, nxt) => {
                total[nxt] ? total[nxt]-- : total[nxt] = -1;
                return total;
            }, counter);

            let legal = Object.values(counter).every((x) => x >= 0);

            if (legal) {
                dispatch(this.enterLetter(letter));
            } else {
                dispatch(this.rejectLetter(letter));
            }   
        }        
    }

    shuffleLetters() {
        return {
            type: SHUFFLE_LETTERS,
            receivedAt: Date.now()
        }
    }

    updateGameState(gameId, gameState) {
        return {
            type: UPDATE_GAME_STATE,
            gameId: gameId,
            gameState: gameState,
            receivedAt: Date.now()
        }
    }

    wordResponse(gameId, playerId, word, result) {
        return {
            type: WORD_RESPONSE,
            gameId: gameId,
            playerId: playerId,
            word: word,
            result: result,
            receivedAt: Date.now()
        }
    }    
    
    playerCreatesGame(playerId) {
        // Thunk
        return (dispatch) => {
            this.gameClient.joinGame(undefined, playerId);
        }
    }

    playerJoinsGame(playerId, gameId) {
        // Thunk
        return (dispatch) => {
            this.gameClient.joinGame(gameId, playerId);
        }
    }

    playerPushesStartGame(gameId, playerId) {
        // Thunk
        // Fires the start game request
        return (dispatch) => {
            this.gameClient.startGame(gameId, playerId);
        }
    }  

    playerEntersWord(gameId, playerId) {
        // Thunk
        // Fires enter word, calls submit word.
        return (dispatch, getState) => {
            let word = getState().player.typed;
            dispatch({
                type: USER_SUBMIT_WORD,
                word: word,
                gameId: gameId,
                playerId: playerId,
                receivedAt: Date.now()
            });
            dispatch(this.submitWord(gameId, playerId, word));
        }
    }

    submitWord(gameId, playerId, word) {
        // Thunk    
        // Fires submit word, makes network request.
        return (dispatch) => {
            this.gameClient.sendWord(gameId, playerId, word);
            dispatch({
                type: REQUEST_WORD,
                word: word,
                gameId: gameId,
                playerId: playerId,
                receivedAt: Date.now()
            });
        }
    }

}