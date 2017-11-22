
import React, { Component } from 'react';

const GameInputComponent = ({ letters, typed, gameStatus, onStartClick, onRestartClick, notifyAccept, notifyReject, lastAccepted }) => {
    
    let gameLetterClass = "game-letter";
    let gameLetterAcceptClass = " accept";
    let gameLettersToSignal = 0;
    if (notifyAccept && (lastAccepted != null)) {
        gameLettersToSignal = lastAccepted.length;
    }
    let inputLetterClass = "input-letter";
    if (notifyReject) {
        inputLetterClass += " reject";
    }

    return <div className="game-input">
        <div className="game-letters">
            {
                letters.split('').map((r, idx) => <div key={r + idx} className={gameLetterClass + (idx < gameLettersToSignal ? gameLetterAcceptClass : "")}>{r}</div>)
            }
        </div>

        {gameStatus === 'WAITING' &&
            <button id="startbutton" onClick={onStartClick}>Start!</button>
        }

        {gameStatus === 'SCHEDULED' &&
            <h1>Starting soon ...</h1>
        }

        {gameStatus === 'PLAYING' &&
            <div className={"input-letters"}>
                {
                    typed.split('').map((t, idx) => <div key={t + idx} className={inputLetterClass}>{t}</div>)
                }
            </div>
        }

        {gameStatus === 'COMPLETED' &&
            <div className="gameover"><h1>Game Over!</h1><button id="restartbutton" onClick={onRestartClick}>New Game</button></div>

        }
    </div>

};

export default GameInputComponent;