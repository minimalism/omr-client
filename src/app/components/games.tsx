import React from 'react';

class GamesListState {
    gameIds : string[] = [];
}

export default class GamesList extends React.Component<{}, GamesListState> {

    ref : firebase.database.Reference;

    constructor(props){
        super(props);
        this.state = new GamesListState();
        this.ref = firebase.database().ref().child('/games');
    }

    render(){
        return (
            <div>
            { this.state.gameIds.map((gameId) => { return <Game id={ gameId }/> }) }
            </div>
        );
    }

    gameAdded(gameData){
        var state = this.state;
        state.gameIds.push(gameData.key);
        this.setState(state);
    }

    gameRemoved(gameData){
        alert("todo");
    }

    componentWillMount(){
        this.ref.on('child_added', this.gameAdded.bind(this));
        this.ref.on('child_removed', this.gameRemoved.bind(this));
    }

    componentWillUnmount(){
        this.ref.off();
    }
}

interface GameProperties {
    id : string;
}

class Game extends React.Component<GameProperties, {}> {

    constructor(props){
        super(props);
    }

    render(){
        return (<div>Here's game { this.props.id }</div>);
    }
}