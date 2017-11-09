import React, { Component } from 'react';

const GameInputArea = ({ letters, typed, gameStatus, onStartClick}) => {

  return <div className="game-input">
      <div className="game-letters">
        {
          letters.split('').map(r => <div className="game-letter">{r}</div>)
        }
      </div>

      { gameStatus === 'WAITING' && 
          <button id="startbutton" onClick={onStartClick}>Start!</button> 
      }

      {gameStatus === 'SCHEDULED' &&
        <h1>Starting soon ...</h1>
      }

      {gameStatus === 'PLAYING' &&
        <div className="input-letters">
          {
            typed.split('').map(t => <div className="input-letter">{t}</div>)
          }
        </div>   
      }

      {gameStatus === 'COMPLETED' &&
        <h1>Game Over!</h1>
      }
  </div>

};

const LockedWord = ({len}) => {
  let letters = new Array(len);
  letters.fill(<div className="letter"> </div>)
  return <div className = "game-word locked">
    {letters}
  </div>
}

const GameWordList = ({ wordCount, myWords, oppWords, revealedWords, gameStatus }) => {

 let allWords = [];

 wordCount.forEach((wordCount, wordLen) => {
  let maxToShow = 8;

  let u = oppWords.filter((w) => w.length == wordLen);
  let m = myWords.filter((w) => w.length == wordLen);
  let unlockedNum = u.length + m.length;
  let lockedNum = wordCount - unlockedNum;
  let opponentUnlocked = u.length;

  let myWordDom = m.map((w) => <div className="game-word unlocked">
    { w.split('').map((l) => <div className="letter">{l}</div>) }
  </div>)
  allWords.push(myWordDom);

  let oppWordDom = u.map((w) => <div className= "game-word locked used">
    { w.split('').map((l) => <div className="letter">{l}</div>) }
  </div> );
  allWords.push(oppWordDom);

  let roomLeft = Math.max(maxToShow - unlockedNum, 1);

  if (gameStatus === "PLAYING") {
    let lockedNumToShow = Math.min(roomLeft, lockedNum);
    let lockedWordDom = new Array(lockedNumToShow);
    lockedWordDom.fill(<LockedWord len={wordLen} />)
    allWords.push(lockedWordDom);
  } else if (gameStatus === "COMPLETED" && revealedWords != null) {
    let revealedNumToShow = Math.min(roomLeft, lockedNum);
    let revealedWordDom = revealedWords
      .filter((w) => w.length == wordLen && !u.includes(w) && !m.includes(w))
      .slice(0, revealedNumToShow)
      .map((w) => <div className="game-word"> 
        { w.split('').map((l) => <div className="letter">{l}</div>) }
      </div>)
    allWords.push(revealedWordDom);
  }

 });

  return <div className="game-bottom">
    <div className="game-words">
      {allWords}
    </div>
  </div>

}

let trim = (s, len = 15) => {

  if (s == null) {
    return s;
  }

  if (s.length > len) {
    return s.slice(0, len) + '...';
  } else {
    return s;
  }

}

const GameTimer = ({secondsRemaining, gameStatus}) => {
  if (gameStatus === "WAITING") {
    return <div className="timer-container">
      <span className="countdown-time">{"Waiting to start ..."}</span>
    </div>    
  } else {
    let timeToShow = "";
    if (typeof secondsRemaining == 'number' && !isNaN(secondsRemaining)) {
      timeToShow = secondsRemaining > 0 ? secondsRemaining : 0;
    }
    return <div className="timer-container">
      <span className="countdown-time">{timeToShow}</span>
    </div>
  }
}


const GameScoreList = ({playerList, myPlayerId, maxScore}) => {
  
  let scoreList = playerList.map(({ playerId, name, score }) => <div className="score">
    <div className={"score-meter " + (myPlayerId === playerId ? "myPlayer" : "")}>
      <span className="score-meter-fill" style={{ width: Math.min(100, parseInt((score / maxScore) * 100)) + '%'}}></span>
      <span className="score-label">{trim(name || playerId)}</span>
      <span className="score-amount">{score}</span>
    </div>
  </div>)

  return <div className="score-list">{scoreList}</div>
}

const GameTopArea = ({ secondsRemaining, playerList, myPlayerId, maxScore, gameStatus}) => {
  return <div className="game-top"> 
    <GameTimer secondsRemaining={secondsRemaining} gameStatus={gameStatus}/>
    <GameScoreList playerList={playerList} myPlayerId={myPlayerId} maxScore={maxScore} />
  </div>
}

const Game = ({letters, typed, myWords, oppWords, wordCount,
  timeRemaining, players, myPlayerId, gameStatus, onStartClick,
  maxScore, revealedWords}) => {
  
  let myList = myWords.map((w) => {
    return <li key={w}>{w}</li>
  })

  return (
    <div className="eggwords">      
      <GameTopArea secondsRemaining={timeRemaining} myPlayerId={myPlayerId} playerList={players} maxScore={maxScore} gameStatus={gameStatus}/>
      <GameInputArea letters={letters} typed={typed} gameStatus={gameStatus} onStartClick={onStartClick}/>
      <GameWordList wordCount={wordCount} myWords={myWords} oppWords={oppWords} revealedWords={revealedWords} gameStatus={gameStatus}/>
    </div>
  )
}

Game.propTypes = {
};
Game.defaultProps = {
  letters: '',
  typed: '',
  myWords: [],
  oppWords: [],
  wordCount: [],
  timeRemaining: null,
  players: [],
  myPlayerId: null,
  gameStatus: 'WAITING',
  onStartClick: () => {},
  revealedWords: [],
  maxScore: -1
};

export default Game;