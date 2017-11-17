import React, { Component } from 'react';
import { RIEToggle, RIEInput, RIETextArea, RIENumber, RIETags, RIESelect } from 'riek';
import GameInputComponent from './GameInputComponent';

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

class RieWrapper extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return <RIEInput
      {...this.props} /> 
  }

  shouldComponentUpdate(nextProps, nextState) {
    // https://reactjs.org/docs/react-component.html#shouldcomponentupdate

    // This is a hack to prevent the editable component from refreshing (and losing the input ref) every
    // time the parent does.

    // I'm only using this component temporarily, so I'm not too worried about the drawbacks here.

    return this.props.value !== nextProps.value;
  }

}


const GameScoreList = ({playerList, myPlayerId, maxScore, onNameChange}) => {
  
  let scoreList = playerList.map(({ playerId, name, score }) => <div className="score" key={playerId + "-score"}>
    <div className={"score-meter " + (myPlayerId === playerId ? "myPlayer" : "")}>
      <span className="score-meter-fill" style={{ width: Math.min(100, parseInt((score / maxScore) * 100)) + '%'}}></span>
      {myPlayerId === playerId ? 
        <RieWrapper key={playerId + '-score-input'}
          value={trim(name || playerId)}
          change={(o) => onNameChange(o.name)}
          propName='name'
          className='score-label'/> : 
        <span className="score-label">{trim(name || playerId)}</span> }
     
      <span className="score-amount">{score}</span>
    </div>
  </div>)

  return <div className="score-list">{scoreList}</div>
}

const GameTopArea = ({ secondsRemaining, playerList, myPlayerId, maxScore, gameStatus, onNameChange}) => {
  return <div className="game-top"> 
    <GameTimer secondsRemaining={secondsRemaining} gameStatus={gameStatus}/>
    <GameScoreList playerList={playerList} myPlayerId={myPlayerId} maxScore={maxScore} onNameChange={onNameChange}/>
  </div>
}

const Game = ({letters, typed, myWords, oppWords, wordCount,
  timeRemaining, players, myPlayerId, gameStatus, onStartClick, 
  onRestartClick, onNameChange, maxScore, revealedWords,
  notifyAccept, notifyReject, lastAccepted, lastRejected}) => {
  
  let myList = myWords.map((w) => {
    return <li key={w}>{w}</li>
  })

  return (
    <div className="eggwords">      
      <GameTopArea secondsRemaining={timeRemaining} myPlayerId={myPlayerId} playerList={players} maxScore={maxScore} gameStatus={gameStatus} onNameChange={onNameChange}/>
      <GameInputComponent letters={letters} typed={typed} gameStatus={gameStatus} 
        notifyAccept={notifyAccept} notifyReject={notifyReject} lastAccepted={lastAccepted}
        onStartClick={onStartClick} onRestartClick={onRestartClick}/>
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
  onRestartClick: () => { },
  revealedWords: [],
  maxScore: -1
};

export default Game;