
import React, { Component } from 'react';

const GameOverComponent = ({ gameStatus, onRestartClick, myPlayerId, playerList }) => {

    let msg = "Game over!";
    let wonMultiplayer = false;

    if (playerList.length > 1) {
        let topScorer = playerList.reduce((p1, p2) => {
            return (p1.score > p2.score) ? p1 : p2;
        });
        wonMultiplayer = topScorer.playerId === myPlayerId;
        if (wonMultiplayer) {
            msg = "You won!"
        }
    }
    
    return <div className="gameover">
        <h1 className={wonMultiplayer ? "victory" : ""}>{msg}</h1>
            <button id="restartbutton" onClick={onRestartClick}>New Game</button>
        </div>
};

export default GameOverComponent;