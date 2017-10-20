import rootReducer from './index';
import  * as Actions from '../Actions';

import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';


export function newStore() {
    const loggerMiddleware = createLogger({
        colors: {
            title: false,
             prevState: false,
             action: false,
             nextState: false,
             error: false
        }
    });
    const store = createStore(
        rootReducer,
        applyMiddleware(
          thunkMiddleware, // lets us dispatch() functions
          loggerMiddleware // neat middleware that logs actions
        )
    );
    return store;
}


it('can enter letters', () => {
    let actionFactory = new Actions.ActionFactory();
    let store = newStore();
    let gameId = 'febc9c72-6fc1-4180-80ba-69a673f4eb2d';

    store.dispatch(actionFactory.newGame(gameId, '3101ccde-8904-46cf-ad59-65eb26c30419'));

    let updatedGameState = {
        gameId: gameId,
		gameStatus: 'PLAYING',
		letters: 'ssdpier',
		usedWords: {},
		startTime: '2017-10-18T12:57:50+00:00',
		endTime: '2017-10-18T12:59:50+00:00',
		players: ['3101ccde-8904-46cf-ad59-65eb26c30419', '51847e6c-b7a3-462d-8e82-e7f0b4bedfba'],
    };
    store.dispatch(actionFactory.updateGameState(gameId, updatedGameState));
    
    store.dispatch(actionFactory.typeLetter('s'));
    store.dispatch(actionFactory.typeLetter('x'));
    store.dispatch(actionFactory.typeLetter('s'));
    store.dispatch(actionFactory.backspace());
    store.dispatch(actionFactory.backspace());
    store.dispatch(actionFactory.backspace());
    
    'spiders'.split('').forEach((l) => {
        store.dispatch(actionFactory.typeLetter(l))
    });

    store.dispatch(actionFactory.clearTyped());
});

it('works', () => {
    let actionFactory = new Actions.ActionFactory();
    let store = newStore();
    let gameId = 'febc9c72-6fc1-4180-80ba-69a673f4eb2d';

    store.dispatch(actionFactory.newGame(gameId, '3101ccde-8904-46cf-ad59-65eb26c30419'));

    let updatedGameState = {
        gameId: gameId,
		gameStatus: 'WAITING',
		letters: '',
		usedWords: {},
		startTime: null,
		endTime: null,
		players: ['3101ccde-8904-46cf-ad59-65eb26c30419', '51847e6c-b7a3-462d-8e82-e7f0b4bedfba'],
    };
    store.dispatch(actionFactory.updateGameState(gameId, updatedGameState));

    updatedGameState = {
        gameId: gameId,
		gameStatus: 'SCHEDULED',
		letters: 'ssdpier',
		usedWords: {},
		startTime: '2017-10-18T12:57:50+00:00',
		endTime: '2017-10-18T12:59:50+00:00',
		players: ['3101ccde-8904-46cf-ad59-65eb26c30419', '51847e6c-b7a3-462d-8e82-e7f0b4bedfba'],
    };
    store.dispatch(actionFactory.updateGameState(gameId, updatedGameState));

    updatedGameState = {
        gameId: gameId,
		gameStatus: 'PLAYING',
		letters: 'ssdpier',
		usedWords: {},
		startTime: '2017-10-18T12:57:50+00:00',
		endTime: '2017-10-18T12:59:50+00:00',
		players: ['3101ccde-8904-46cf-ad59-65eb26c30419', '51847e6c-b7a3-462d-8e82-e7f0b4bedfba'],
    };
    store.dispatch(actionFactory.updateGameState(gameId, updatedGameState));
    
    updatedGameState = {
        gameId: gameId,
		gameStatus: 'PLAYING',
		letters: 'ssdpier',
		usedWords: {
            '3101ccde-8904-46cf-ad59-65eb26c30419': [
				'dire','spied','rises'
			],
			'51847e6c-b7a3-462d-8e82-e7f0b4bedfba': [
				'spiders','diss','sides','drip'
			]
        },
		startTime: '2017-10-18T12:57:50+00:00',
		endTime: '2017-10-18T12:59:50+00:00',
		players: ['3101ccde-8904-46cf-ad59-65eb26c30419', '51847e6c-b7a3-462d-8e82-e7f0b4bedfba'],
    };
    store.dispatch(actionFactory.updateGameState(gameId, updatedGameState));         

    updatedGameState = {
        gameId: gameId,
		gameStatus: 'COMPLETED',
		letters: 'ssdpier',
		usedWords: {
            '3101ccde-8904-46cf-ad59-65eb26c30419': [
				'dire','spied','rises'
			],
			'51847e6c-b7a3-462d-8e82-e7f0b4bedfba': [
				'spiders','diss','sides','drip'
			]
        },
		startTime: '2017-10-18T12:57:50+00:00',
		endTime: '2017-10-18T12:59:50+00:00',
		players: ['3101ccde-8904-46cf-ad59-65eb26c30419', '51847e6c-b7a3-462d-8e82-e7f0b4bedfba'],
    };
    store.dispatch(actionFactory.updateGameState(gameId, updatedGameState));   

    store.dispatch(actionFactory.shuffleLetters());
});
