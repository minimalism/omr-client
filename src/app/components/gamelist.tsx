import React from 'react';
import Game from './game';
import * as _ from 'lodash';

class GamesListState {
    gameIds : string[] = [];
    newGameName : string = '';
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
                        onChange = { this.newGameNameChanged }/><button onClick = { this.createGame } >New game</button>
                </div>
            </div>
        );
    }

    newGameNameChanged = (e) => {
        let state = this.state;
        state.newGameName = e.target.value;
        this.setState(state);
    }

    createGame = () => {
        const currentUserId = firebase.auth().currentUser.uid;

        let update = {};

        const newGameKey = firebase.database().ref().child('/games').push().key;
        let gameData = {
            name: this.state.newGameName,
            host: currentUserId,
            status: 0
        };

        update['games/' + newGameKey] = gameData;

        firebase.database().ref().update(update).then((response) => {
            /* Game creation success */
            let participantUpdate = {};

            const newParticipantKey = firebase.database().ref().child('/participants').push().key;
            let participantData = {
                user : currentUserId,
                game : newGameKey
            };

            let gameParticipantData = {
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

    gameAdded = (gameData) => {
        const state = this.state;
        state.gameIds.push(gameData.key);
        this.setState(state);
    }

    gameRemoved = (gameData) => {
        const state = this.state;
        _.pull(state.gameIds, gameData.key);
        this.setState(state);
    }

    componentWillMount(){
        firebase.database().ref().child('/games').on('child_added', this.gameAdded);
        firebase.database().ref().child('/games').on('child_removed', this.gameRemoved);
    }

    componentWillUnmount(){
        firebase.database().ref().child('/games').off();
    }
}
