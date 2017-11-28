import Rx from 'rxjs/Rx';

/**
 * Simple redux middleware to act as an adapter between redux actions and an RxJS observable. 
 * 
 * Returns a redux middleware that emits the stream of redux actions as an RxJS observable.
 * The observable is available as the 'observable' property on the returned middleware.
 * 
 * @example
 * const rxMiddleware = RxActionMiddleware();
 * let reduxActionStream = rxMiddleware.observable;
 * const store = createStore(
 *     rootReducer,
 *     applyMiddleware(
 *       thunkMiddleware,
 *       loggerMiddleware,
 *       rxMiddleware
 *     )
 * );
 * @returns
 * A redux middleware with an additional 'observable' property.
 */
function createRxActionMiddleware() {
    let reduxActionStream = new Rx.Subject();
    const rxMiddleware = store => next => action => {
        if (action.type != 'ENTER_LETTER'
            && action.type != 'REJECT_LETTER') {
            reduxActionStream.next(action);
        }
        return next(action)
    }
    rxMiddleware.observable = reduxActionStream;    
    return rxMiddleware;
}

export default createRxActionMiddleware;