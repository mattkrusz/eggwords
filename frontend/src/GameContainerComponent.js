import { connect } from 'react-redux';

import Game from './GameComponent';

let storage = window.localStorage;

/**
 * Function that creates a GameReduxContainer. Requires an actionFactory instance
 * for dispatching events.
 * 
 * @param {*} actionFactory 
 */
function createContainerComponent(actionFactory) {
    const mapStateToProps = state => {
        let myPlayerId = state.player.playerId;
        let usedWords = state.game.usedWords;
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
            usedWords: usedWords,
            wordCount: state.game.wordCount || [],
            endTimestamp: state.game.endTimestamp,
            expireTimestamp: state.game.expireTimestamp,
            gameId: state.game.gameId,
            myPlayerId: myPlayerId,
            myPlayerToken: state.player.playerToken,
            players: players,
            maxScore: 10000,
            gameStatus: state.game.gameStatus,
            revealedWords: state.game.revealedWords,
            notifyAccept: state.player.notifyAccept,
            notifyReject: state.player.notifyReject,
            lastAccepted: state.player.lastAccepted,
            lastRejected: state.player.lastRejected,
            joinGameError: state.errors.joinGameError
        }
    }

    const mapDispatchToProps = dispatch => {
        return {
            onStartClick: (gameId, playerId) => {
                dispatch(actionFactory.playerPushesStartGame(gameId, playerId));
            },
            onRestartClick: (gameId, playerId) => {
                dispatch(actionFactory.playerPushesRestartGame(gameId, playerId));
            },
            onNameChange: (gameId, playerId, playerToken, n) => {
                storage.setItem("playerName", n);
                dispatch(actionFactory.requestChangeName(gameId, playerId, playerToken, n));
            }
        }
    }

    let GameReduxContainer = connect(
        mapStateToProps,
        mapDispatchToProps
    )(Game)

    return GameReduxContainer;
}

export default createContainerComponent;