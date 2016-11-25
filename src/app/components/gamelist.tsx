import React from 'react';
import Game from './game';
import * as _ from 'lodash';

class GamesListState {
    gameIds : string[] = [];
    newGameName : string;
}

export default class GamesList extends React.Component<{}, GamesListState> {

    constructor(props){
        super(props);
        this.state = new GamesListState();
    }

    render(){
        return (
            <div className="game-window">
                <div className="game-list">
                    { this.state.gameIds.map((gameId) => { return <Game key={ gameId } id={ gameId }/> }) }
                </div>
                <div className="game-list-menu">
                    <input placeholder="New game name" 
                        value = { this.state.newGameName } 
                        onChange = { this.newGameNameChanged.bind(this) }/><button onClick = { () => this.createGame() } >New game</button>
                </div>
            </div>
        );
    }
    
    newGameNameChanged(e){
        var state = this.state;
        state.newGameName = e.target.value;
        this.setState(state);
    }

    createGame(){
        var currentUserId = firebase.auth().currentUser.uid;

        var update = {};

        var newGameKey = firebase.database().ref().child('/games').push().key;
        var gameData = {
            name: this.state.newGameName,
            host: currentUserId,
            status: 0
        };

        update['games/' + newGameKey] = gameData;

        firebase.database().ref().update(update).then((response) => {
            /* Game creation success */ 
            var participantUpdate = {};

            var newParticipantKey = firebase.database().ref().child('/participants').push().key;
            var participantData = {
                user : currentUserId,
                game : newGameKey
            };

            var gameParticipantData = {
                participant: newParticipantKey
            };

            participantUpdate['participants/' + newParticipantKey] = participantData;
            participantUpdate['games/' + newGameKey + '/participants/0'] = gameParticipantData; 

            firebase.database().ref().update(participantUpdate).then(() => {
                // Game participant creation success
                // TODO: Commit transaction
            
            }, (fail) => {
                // Game patricipant creation fail  
                // TODO: Roll back transaction
            })

        }, (fail) => {
            alert("Failed to create game");
        });
    }

    gameAdded(gameData){
        var state = this.state;
        state.gameIds.push(gameData.key);
        this.setState(state);
    }

    gameRemoved(gameData){
        var state = this.state;
        _.pull(state.gameIds, gameData.key);
        this.setState(state);
    }

    componentWillMount(){
        firebase.database().ref().child('/games').on('child_added', this.gameAdded.bind(this));
        firebase.database().ref().child('/games').on('child_removed', this.gameRemoved.bind(this));
    }

    componentWillUnmount(){
        firebase.database().ref().child('/games').off();
    }
}