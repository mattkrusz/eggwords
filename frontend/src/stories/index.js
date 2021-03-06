import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import Game from '../GameComponent';
import GameInput from '../GameInputComponent';
import CountdownTimer from '../Timer';
import '../index.css';

let endTime = new Date((new Date()).getTime() + 119554);

storiesOf('Game', module)
  .add('Basic', () => <Game 
    myWords={['aced', 'aide', 'chined', 'hin', 'cnida', 'haen', 'din', 'ache', 'china', 'ace', 'chide', 'die', 'haed', 'iced', 'ahed', 'chained']}
    oppWords={['caid', 'caned', 'ached', 'hind', 'inch', 'hen', 'hance', 'nice', 'head', 'chai', 'nide', 'niche', 'dan', 'niched', 'dah', 'hied', 'canid', 'hand', 'chine']}
    wordCount={[0,0,0,28,37,13,5,3]}
    letters={'enca'}
    typed={'hid'}
    endTime={endTime}
    myPlayerId={'70b0e89e-760b-4576-912b-590c03c174d0'}
    players={[{
        playerId: '70b0e89e-760b-4576-912b-590c03c174d0',
        name: 'Player 1',
        score: 1750},
      {
        playerId: 'b595e875-fd53-4fb9-9b13-ad87d10bac58',
        name: 'Player 2',
        score: 1025
      }]}
    maxScore={10000}
    gameStatus={'PLAYING'}
    onStartClick={() => {}}/>)
  .add('Waiting', () => <Game
    /* myWords={[]}
    oppWords={[]}
    wordCount={[]}
    letters={'ndcehai'}
    typed={'chide'}
    endTime={endTime} */
    myPlayerId={'70b0e89e-760b-4576-912b-590c03c174d0'}
    players={[{
      playerId: '70b0e89e-760b-4576-912b-590c03c174d0',
      name: 'Player 1',
      score: 0
    },
    {
      playerId: 'b595e875-fd53-4fb9-9b13-ad87d10bac58',
      name: 'Player 2',
      score: 0
    }]}
    /* maxScore={10000} */
    gameStatus={'WAITING'}
    onStartClick={() => { }} />)
  .add('Completed', () => <Game
    myWords={['aced', 'aide', 'chined', 'hin', 'cnida', 'haen', 'din', 'ache', 'china', 'ace', 'chide', 'die', 'haed', 'iced', 'ahed', 'chained']}
    oppWords={['caid', 'caned', 'ached', 'hind', 'inch', 'hen', 'hance', 'nice', 'head', 'chai', 'nide', 'niche', 'dan', 'niched', 'dah', 'hied', 'canid', 'hand', 'chine']}
    wordCount={[0, 0, 0, 28, 37, 13, 5, 3]}
    letters={'enca'}
    typed={'hid'}
    endTime={new Date()}
    myPlayerId={'70b0e89e-760b-4576-912b-590c03c174d0'}
    players={[{
      playerId: '70b0e89e-760b-4576-912b-590c03c174d0',
      name: 'Player 1',
      score: 1750
    },
    {
      playerId: 'b595e875-fd53-4fb9-9b13-ad87d10bac58',
      name: 'Player 2',
      score: 1025
    }]}
    maxScore={10000}
    gameStatus={'COMPLETED'}
    onStartClick={() => { }}
    onRestartClick={() => { }} />)
  .add('CompletedDefeat', () => <Game
    myWords={['aced', 'aide', 'chined', 'hin', 'cnida', 'haen', 'din', 'ache', 'china', 'ace', 'chide', 'die', 'haed', 'iced', 'ahed', 'chained']}
    oppWords={['caid', 'caned', 'ached', 'hind', 'inch', 'hen', 'hance', 'nice', 'head', 'chai', 'nide', 'niche', 'dan', 'niched', 'dah', 'hied', 'canid', 'hand', 'chine']}
    wordCount={[0, 0, 0, 28, 37, 13, 5, 3]}
    letters={'enca'}
    typed={'hid'}
    endTime={new Date()}
    myPlayerId={'b595e875-fd53-4fb9-9b13-ad87d10bac58'}
    players={[{
      playerId: '70b0e89e-760b-4576-912b-590c03c174d0',
      name: 'Player 1',
      score: 1750
    },
    {
      playerId: 'b595e875-fd53-4fb9-9b13-ad87d10bac58',
      name: 'Player 2',
      score: 1025
    }]}
    maxScore={10000}
    gameStatus={'COMPLETED'}
    onStartClick={() => { }}
    onRestartClick={() => { }} />)    
  .add('GameInput Rejected', () => <GameInput
    letters={'sr'}
    typed={'dipes'}
    gameStatus={'PLAYING'}
    onStartClick={() => {}}
    onRestartClick={() => { }}
    notifyReject={true} />)
  .add('GameInput Accepted', () => <GameInput
    letters={'spiders'}
    typed={''}
    gameStatus={'PLAYING'}
    onStartClick={() => { }}
    onRestartClick={() => { }}
    inputStatus={1}
    notifyAccept={true}
    lastAccepted={'spider'} />)     
  .add('CustomCountdown', () => <CountdownTimer 
    endTime={new Date((new Date()).getTime() + 119554)}
    gameStatus={"PLAYING"} />)    