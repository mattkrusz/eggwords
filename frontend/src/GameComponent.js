import React, { Component } from 'react';
import { RIEToggle, RIEInput, RIETextArea, RIENumber, RIETags, RIESelect } from 'riek';
import GameInstructions from './GameInstructions';
import GameInputComponent from './GameInputComponent';
import GameOverComponent from './GameOverComponent';
import CountdownTimer from './Timer';

const LockedWord = ({len}) => {
  let letters = new Array(len);
  for (let i = 0; i < len; i++) {
    letters[i] = <div key={i} className="letter"> </div>
  }
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

  let myWordDom = m.map((w) => <div key={w} className="game-word unlocked">
    { w.split('').map((l) => <div className="letter">{l}</div>) }
  </div>)
  allWords.push(myWordDom);

   let oppWordDom = u.map((w) => <div key={w} className= "game-word locked used">
    { w.split('').map((l) => <div className="letter">{l}</div>) }
  </div> );
  allWords.push(oppWordDom);

  let roomLeft = Math.max(maxToShow - unlockedNum, 1);

  if (gameStatus === "PLAYING") {
    let lockedNumToShow = Math.min(roomLeft, lockedNum);
    let lockedWordDom = new Array(lockedNumToShow);
    for (let i = 0; i < lockedNumToShow; i++) {
      lockedWordDom[i] = <LockedWord key={i} len={wordLen} />
    }
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


/**
 * Wrapper around RIEInput that prevents the component from refreshing unnecessarily.
 */
class RieWrapper extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <RIEInput
      {...this.props} /> 
  }

  shouldComponentUpdate(nextProps, nextState) {
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

  let multiplayerInstructions = playerList.length == 1 ?
    <span className="multiplayer-instructions">Share the game URL to invite another player!</span> : '';

  return <div className="score-list">
    {scoreList}
    {multiplayerInstructions}
  </div>
}

const GameTopArea = ({ endTimestamp, playerList, myPlayerId, maxScore, gameStatus, onNameChange}) => {
  return <div className="game-top"> 
    <CountdownTimer endTimestamp={endTimestamp} gameStatus={gameStatus} />
    <GameScoreList playerList={playerList} myPlayerId={myPlayerId} maxScore={maxScore} onNameChange={onNameChange}/>
  </div>
}

class Game extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gameExpired: false,
      intervalId: null
    }
  }

  isExpired() {
    let timeLeft = (this.props.expireTimestamp - (new Date()).getTime());
    return timeLeft < 0;
  }

  checkExpired() {
    let expired = this.isExpired();
    if (expired && !this.state.gameExpired) {
      this.setState({gameExpired: true});
    } else if (!expired && this.state.gameExpired) {
      this.setState({gameExpired: false});
    }
  }

  componentDidMount() {
    let intervalId = setInterval(() => this.checkExpired(), 1000);
    this.setState({ intervalId: intervalId });
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalId);
  }

  render() {
    let { letters, typed, myWords, oppWords, wordCount,
      endTimestamp, expireTimestamp, players, myPlayerId, myPlayerToken, gameId,
      gameStatus, onStartClick, onRestartClick, onNameChange, maxScore, revealedWords,
      notifyAccept, notifyReject, lastAccepted, lastRejected, joinGameError } = this.props;

    let myList = myWords.map((w) => {
      return <li key={w}>{w}</li>
    })

    let middleComponent = undefined;
    if (gameStatus === 'COMPLETED') {
      middleComponent = <GameOverComponent gameStatus={gameStatus}
        gameExpired={this.state.gameExpired}
        onRestartClick={() => onRestartClick(gameId, myPlayerId)}
        myPlayerId={myPlayerId}
        playerList={players} />
    } else {
      middleComponent = <GameInputComponent letters={letters} typed={typed} gameStatus={gameStatus}
        notifyAccept={notifyAccept} notifyReject={notifyReject} lastAccepted={lastAccepted}
        onStartClick={() => onStartClick(gameId, myPlayerId)} />
    }

    return (
      <div className="eggwords">                
        <GameTopArea endTimestamp={endTimestamp} myPlayerId={myPlayerId} playerList={players} 
          maxScore={maxScore} gameStatus={gameStatus}
          onNameChange={(newName) => onNameChange(gameId, myPlayerId, myPlayerToken, newName)} />
        {joinGameError != null ? <div className="errorMessage">{joinGameError} Click <a href="/">here</a> to start a new game.</div> : "" }
        {middleComponent}
        <GameWordList wordCount={wordCount} myWords={myWords} oppWords={oppWords} revealedWords={revealedWords} gameStatus={gameStatus} />
        <GameInstructions />
      </div>
    )
  }
}

Game.propTypes = {
};
Game.defaultProps = {
  letters: '',
  typed: '',
  myWords: [],
  oppWords: [],
  wordCount: [],
  players: [],
  myPlayerId: null,
  gameStatus: 'WAITING',
  onStartClick: () => {},
  onRestartClick: () => { },
  revealedWords: [],
  maxScore: -1
};

export default Game;