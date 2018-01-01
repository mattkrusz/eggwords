import * as Actions from '../Actions';

export default class EventAdapter {

    constructor(gameClient, store) {
        this.gameStream = gameClient.observable();
        this.store = store;
        this.actionFactory = new Actions.ActionFactory(gameClient);

        this.gameStream
            .filter((e) => e.action.type === 'NewGameResponse')
            .subscribe((e) => {
                let newGameAction = this.actionFactory.newGame(e.action.gameId, e.action.playerId, e.action.playerToken);
                this.store.dispatch(newGameAction);
            });

        this.gameStream
            .filter((e) => e.action.type === 'JoinGameResponse')
            .subscribe((e) => {
                if (e.action.success) {
                    let joinGameAction = this.actionFactory.joinGame(e.action.gameId, 
                        e.action.playerId, e.action.playerToken);
                    this.store.dispatch(joinGameAction);     
                } else {
                    let joinGameError = this.actionFactory.joinGameError(e.action.gameId, 
                        e.action.playerId, e.action.playerToken, e.action.message);
                    this.store.dispatch(joinGameError);
                }   
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
        
        this.gameStream
            .filter((e) => e.action.type === 'RevealWords')
            .subscribe((e) => {
                let revealWordsAction = this.actionFactory.revealWords(e.action.gameId, e.action.words);
                this.store.dispatch(revealWordsAction);
        });

        this.gameStream
            .filter((e) => e.action.type === 'GameReinitialized')
            .subscribe((e) => {
                let reinitAction = this.actionFactory.gameReinitialized(e.action.gameId);
                this.store.dispatch(reinitAction);
        }); 
        
        this.gameStream
            .filter((e) => e.action.type === 'PlayerInfoUpdate')
            .subscribe((e) => {
                console.log("Received PlayerInfoUpdate", e);
                if (e.action.accept) {
                    let updatePlayerAction = this.actionFactory.updatePlayerInfo(e.action.gameId, e.action.playerId, e.action.info);
                    this.store.dispatch(updatePlayerAction);
                }                
        }); 
    }

}