import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';

// Pure presentational component for the game timer
const GameTimer = ({ secondsRemaining, gameStatus }) => {
    if (gameStatus === "WAITING") {
        return <div className="timer-container">
            <span className="countdown-time">{"Waiting to start ..."}</span>
        </div>
    } else {
        let timeToShow = "";
        if (typeof secondsRemaining == 'number' && !isNaN(secondsRemaining)) {
            timeToShow = parseInt(secondsRemaining > 0 ? secondsRemaining : 0);
        }
        return <div className="timer-container">
            <span className="countdown-time">{timeToShow}</span>
        </div>
    }
}

// Stateful component that re-renders the GameTimer timer at intervals 
// as it counts down.
class CountdownTimer extends Component {
    constructor(props) {
        super(props);

        let secondsRemaining = props.endTimestamp == null ? null : this.secondsUntil(props.endTimestamp);

        this.state = {
            secondsRemaining: secondsRemaining,
            intervalId: null
        }
    }

    secondsUntil(msTimestamp) {
        return (msTimestamp - (new Date()).getTime()) / 1000;
    }

    componentDidMount() {        
        let intervalId = setInterval(() => this.tick(), 250);
        this.setState({intervalId: intervalId});
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalId);
    }

    tick() {
        // Set state.secondsRemaining to (endTimestamp - curTime)
        let secondsRemaining = this.props.endTimestamp == null ? null : this.secondsUntil(this.props.endTimestamp);
        this.setState({secondsRemaining: secondsRemaining});
    }

    render() {
        return <GameTimer secondsRemaining={this.state.secondsRemaining}
            gameStatus={this.props.gameStatus}/>
    }
}

CountdownTimer.propTypes = {
    endTimestamp: PropTypes.instanceOf(Date),
    onComplete: PropTypes.func,
    gameStatus: PropTypes.string
}

export default CountdownTimer;