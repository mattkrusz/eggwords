
export const NEW_GAME = 'NEW_GAME';
export const JOIN_GAME = 'JOIN_GAME';
export const UPDATE_GAME_STATE = 'UPDATE_GAME_STATE';
export const REINITIALIZE_GAME = 'REINITIALIZE_GAME';
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
export const REVEAL_WORDS = 'REVEAL_WORDS';
export const REQUEST_CHANGE_NAME = 'REQUEST_CHANGE_NAME';
export const ACCEPT_CHANGE_NAME = 'ACCEPT_CHANGE_NAME';
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
            const { player } = getState();
            if (player.localLetters && player.localLetters.includes(letter)) {
                dispatch(this.enterLetter(letter));
            } else {
                dispatch(this.rejectLetter(letter));
            }
        }        
    }

    changeName(gameId, playerId, name) {
        return {
            type: ACCEPT_CHANGE_NAME,
            gameId: gameId,
            playerId: playerId,
            name: name,
            receivedAt: Date.now()
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

    gameReinitialized(gameId) {
        return {
            type: REINITIALIZE_GAME,
            gameId: gameId,
            receivedAt: Date.now()
        }
    }

    wordResponse(gameId, playerId, word, result) {

        return (dispatch) => {
            dispatch({
                type: WORD_RESPONSE,
                gameId: gameId,
                playerId: playerId,
                word: word,
                result: result,
                receivedAt: Date.now()
            });
            if (result === 'ACCEPT') {
                dispatch(this.clearTyped());
            }
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

    playerPushesRestartGame(gameId, playerId) {
        // Thunk
        // Fires the reinit game request
        return (dispatch) => {
            this.gameClient.reinitGame(gameId, playerId);
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

    revealWords(gameId, words) {
        return {
            type: REVEAL_WORDS,
            gameId: gameId,
            words: words,
            receivedAt: Date.now()
        }
    }

    requestChangeName(gameId, playerId, newName) {
        return (dispatch) => {
            this.gameClient.changeName(gameId, playerId, newName);
            dispatch({
                type: REQUEST_CHANGE_NAME,
                gameId: gameId,
                playerId: playerId,
                name: newName,
                receivedAt: Date.now()
            });
        }            
    }

}