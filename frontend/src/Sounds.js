import Rx from 'rxjs/Rx';

import * as Actions from './Actions';

/**
 * Instances of the GameSound class take the stream of redux actions,
 * and react to them with sounds when appropriate.
 * 
 * Note: This currently does not work on Safari due to its auto-play 
 * policies. (The sounds here are played in response to game events,
 * which may not be directly derived from user input events).
 */
class GameSound {

    constructor(reduxActionStream, playerId) {
        this.playerId = playerId;
        this.muted = false;

        // Set up the streams of events to react to with sound.
        // Start with the "root" stream of redux actions.
        this.reduxActionStream = reduxActionStream;

        this.wordResponseStream = reduxActionStream
            .filter((action) => (action.type === Actions.WORD_RESPONSE));
        this.gamestateUpdateStream = reduxActionStream
            .filter((action) => (action.type === Actions.UPDATE_GAME_STATE));

        // The usedWords part of the state is an object mapping (playerId -> [w1, w2, ...])
        this.usedWordsStream = this.gamestateUpdateStream
            .flatMap((action) => {
                // Invert the usedWords object from { pid: [w1, w2, w3] } to { w1: pid, w2: pid, ... }
                let usedWordsByPid = action.gameState.usedWords;
                return Rx.Observable.from(
                    Object.entries(usedWordsByPid).map(([pid, words]) => words.map((w) => [w, pid])).reduce((acc, cur) => acc.concat(cur), [])
                );
            })
            .distinct((kv) => kv[0]);
        this.myUsedWordsStream = this.usedWordsStream
            .filter((kv) => kv[1] === this.playerId);
        this.opponentUsedWordsStream = this.usedWordsStream
            .filter((kv) => kv[1] !== this.playerId);
            
        this.gameResultStream = this.gamestateUpdateStream
            .filter((action) => (action.type === Actions.UPDATE_GAME_STATE))
            .filter((action) => (action.gameState.gameStatus === "COMPLETED"))
            .distinct((action) => action.gameState.endTime);

        this.gameStartStream = this.gamestateUpdateStream
            .filter((action) => (action.type === Actions.UPDATE_GAME_STATE))
            .filter((action) => (action.gameState.gameStatus === "PLAYING"))
            .distinct((action) => action.gameState.startTime);

        
        // Subscribe to the event streams, delegating to instance methods.
        this.gameResultStream.subscribe(this.handleGameResult);
        this.gameStartStream.subscribe(this.handleGameStart);        
        this.wordResponseStream.subscribe(this.handleWordResponse);
        this.opponentUsedWordsStream.throttleTime(500).subscribe(this.handleOpponentWord);

    }

    mute() {
        this.muted = true;
    }

    unmute() {
        this.muted = false;
    }

    handleOpponentWord = (ouw) => {
        this.playAudioById("audio-opp-word");
    }

    handleWordResponse = (a) => {
        if (a.result === 'REJECT') {
            if (a.rejectReason === Actions.REJECT_REASON.NOT_A_WORD) {
                this.playAudioById("audio-reject-naw");
            } else if (a.rejectReason === Actions.REJECT_REASON.WORD_USED) {
                this.playAudioById("audio-reject-used");
            }
        } else {
            if (a.word.length == 7) {
                this.playAudioById("audio-accept-big");
            } else {
                this.playAudioById('audio-accept');
            }
        }
    }

    handleGameStart = (a) => {
        this.playAudioById("audio-game-start");
    }

    handleGameResult = (a) => {
        let scoreById = a.gameState.score;
        let topScore = Math.max(...Object.values(scoreById));
        let playerWon = scoreById[this.playerId] === topScore;
        let multiplayer = Object.keys(scoreById).length > 1;
        if (multiplayer && playerWon) {
            this.playAudioById('audio-victory');
        } else if (multiplayer) {
            this.playAudioById("audio-defeat");
        } else {
            this.playAudioById("audio-sour-victory");
        }
    }

    playAudioById(id) {
        if (!this.muted) {
            let audio = document.getElementById(id);
            audio.pause();
            audio.currentTime = 0;
            audio.play();
        }
    }
}

export default GameSound;