import React, { Component } from 'react';

const Game = ({letters, typed, myWords, usedWords, 
  timeRemaining, players, gameStatus, onStartClick}) => {
  
  let myList = myWords.map((w) => {
    return <li key={w}>{w}</li>
  })

  let opponentList = usedWords.filter((w) => !myWords.includes(w))
    .map((w) => {
      return <li key={w}>{w}</li>
    })

  return (
    <div>
      <p>Status: {gameStatus} </p>
      <button onClick={onStartClick}>Start</button>
      <p>Time: {timeRemaining}</p>
      <p>Players: {players.length}</p>
      <p>{letters}</p>
      <p>{typed}</p>
      <br/>
      <h2>My Words</h2>
      <ul>
        {myList}
      </ul>
      <h2>Opponent Words</h2>
      <ul>
        {opponentList}
      </ul>
    </div>
  )
}

export default Game;