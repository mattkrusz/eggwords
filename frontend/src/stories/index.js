import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import Game from '../GameComponent';
import '../index.css'

storiesOf('Game', module)
  .add('Basic', () => <Game 
    myWords={['SPIDER', 'DIRE', 'RED', 'SPED', 'PIE', 'SIPS', 'SPIES', 'PIES']}
    oppWords={['RIDE', 'RIDES', 'PIES', 'SPIDERS', 'SIDE', 'SIPE', 'PEDS']}
    wordCount={[0,0,0,26,32,27,12,1]}
    letters={'DISPSER'}
    typed={'RIDES'}
    timeRemaining={85}
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
    onStartClick={() => {}}/>);