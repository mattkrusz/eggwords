import * as Actions from '../Actions';

export default class EventAdapter {

    constructor(gameClient, store) {
        this.gameStream = gameClient.observable();
        this.store = store;
        this.actionFactory = new Actions.ActionFactory(gameClient);

        this.gameStream
            .filter((e) => e.action.type === 'NewGameResponse')
            .subscribe((e) => {
                let newGameAction = this.actionFactory.newGame(e.action.gameId, e.action.playerId);
                this.store.dispatch(newGameAction);
            });

        this.gameStream
            .filter((e) => e.action.type === 'JoinGameResponse')
            .subscribe((e) => {
                let joinGameAction = this.actionFactory.joinGame(e.action.gameId, e.action.playerId);
                this.store.dispatch(joinGameAction);
            });

        this.gameStateStream = this.gameStream
            .filter((e) => e.action.type === 'GameState');
        
        this.gameStateStream.subscribe((e) => {
            let updateGameStateAction = this.actionFactory.updateGameState(e.action.gameId, e.action);
            this.store.dispatch(updateGameStateAction);
        });

        this.wordResponseStream = this.gameStream
            .filter((e) => e.action.type === 'SendWordResponse');

        this.wordResponseStream.subscribe((e) => {
            let wordResponseAction = this.actionFactory.wordResponse(e.action.gameId, 
                e.action.playerId, e.action.word, e.action.result);
            this.store.dispatch(wordResponseAction);
        });
    }

}