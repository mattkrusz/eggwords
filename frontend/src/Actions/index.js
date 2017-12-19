
export const NEW_GAME = 'NEW_GAME';
export const JOIN_GAME = 'JOIN_GAME';
export const UPDATE_GAME_STATE = 'UPDATE_GAME_STATE';
export const REINITIALIZE_GAME = 'REINITIALIZE_GAME';
export const RECEIVE_GAME_STATE  = 'RECEIVE_GAME_STATE ';
export const USER_SUBMIT_WORD = 'USER_SUBMIT_WORD';
export const REQUEST_WORD = 'REQUEST_WORD';
export const WORD_RESPONSE = 'WORD_RESPONSE';
export const END_RESPONSE_NOTIFICATION = 'END_RESPONSE_NOTIFICATION';
export const ENTER_LETTER = 'ENTER_LETTER';
export const REJECT_LETTER = 'REJECT_LETTER';
export const BACKSPACE = 'BACKSPACE';
export const CLEAR_TYPED = 'CLEAR_TYPED';
export const SHUFFLE_LETTERS = 'SHUFFLE_LETTERS';
export const REVEAL_WORDS = 'REVEAL_WORDS';
export const REQUEST_CHANGE_NAME = 'REQUEST_CHANGE_NAME';
export const UPDATE_PLAYER_INFO = 'UPDATE_PLAYER_INFO';

export const REJECT_REASON = {
    NOT_A_WORD: 'NOT_A_WORD',
    WORD_USED_BY_SELF:'WORD_USED_BY_SELF',
    WORD_USED:'WORD_USED'
}

// Probably also need: SHUFFLE

export class ActionFactory {
    constructor(gameClient) {
        this.gameClient = gameClient;        
    }

    newGame(gameId, playerId, playerToken) {
        return {
            type: NEW_GAME,
            gameId: gameId,
            playerId: playerId,
            playerToken: playerToken,
            receivedAt: Date.now()
          }
    }

    joinGame(gameId, playerId, playerToken) {
        return {
            type: NEW_GAME,
            gameId: gameId,
            playerId: playerId,
            playerToken: playerToken,
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

    updatePlayerInfo(gameId, playerId, newInfo) {
        return {
            type: UPDATE_PLAYER_INFO,
            gameId: gameId,
            playerId: playerId,
            info: newInfo,
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

        return (dispatch, getState) => {

            let rejectReason = null;
            if (result == 'REJECT') {
                let wordUsedBy = getState().game.usedWords[word];
                if (wordUsedBy == null) {
                    rejectReason = REJECT_REASON.NOT_A_WORD;
                } else if (wordUsedBy == playerId) {
                    rejectReason = REJECT_REASON.WORD_USED_BY_SELF;                    
                } else {
                    rejectReason = REJECT_REASON.WORD_USED;
                }
                
            }              

            dispatch({
                type: WORD_RESPONSE,
                gameId: gameId,
                playerId: playerId,
                word: word,
                result: result,
                rejectReason: rejectReason,
                receivedAt: Date.now()
            });
            if (result === 'ACCEPT') {
                dispatch(this.clearTyped());
            }
            setTimeout(() => {
                dispatch({
                    type: END_RESPONSE_NOTIFICATION
                });
            }, 500);
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

    requestChangeName(gameId, playerId, payerToken, newName) {
        return (dispatch) => {
            this.gameClient.changeName(gameId, playerId, payerToken, newName);
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