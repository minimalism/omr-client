import React from 'react';
import _ from 'lodash';
import Electron from 'electron';
import Config from '../config';
import Participant from './participant';
import {ParticipantData} from './participant';
import Turn from './turn';

enum Status {
    NotStarted = 0,
    Started = 1,
    Finished = 2
}

interface GameProperties {
    id : string;
}

class GameData {
    name : string;
    host : string;
    status : Status;
    latestTurn : number;
    isMyTurn : boolean;
    isHost : boolean;
    myParticipant : ParticipantData;
    nextTurner : string;
    participants : ParticipantData[] = [];
    showParticipants : boolean;

    constructor(public id : string){
    }
}

export class GameButton{
    constructor(public id : string, public icon : string, public title : string, public callback : () => void){ }
}

export default class Game extends React.Component<GameProperties, GameData> {

    constructor(props){
        super(props);
        this.state = new GameData(this.props.id);
    }

    gameDataChanged = (data) => {
        const state = this.state;
        const values = data.val();
        if (values){
            state.host = values.host;
            state.name = values.name;
            state.status = values.status;

            state.participants = values.participants
                ? _(values.participants)
                    .map((participant, id) => { return new ParticipantData(id, participant) })                
                    .orderBy('data.ordinal')
                    .value()
                : [];

            const currentUserId = firebase.auth().currentUser.uid;
            state.isHost = this.state.host == currentUserId;
            state.myParticipant = this.state.participants.find(participant => participant.userId == currentUserId);
            state.nextTurner = values.nextTurner;

            if (state.status == Status.Started && state.myParticipant){
                state.latestTurn = values.latestTurn;
                state.isMyTurn = state.myParticipant.id == values.nextTurner; 
            }
            else{
                state.isMyTurn = false;
            }

            this.setState(state);
        }
    }

    componentWillMount(){
        firebase.database().ref().child(`/games/${this.props.id}`).on('value', this.gameDataChanged);
    }

    componentWillUnmount(){
        firebase.database().ref().child(`/games/'${this.props.id}`).off();
    }


    delete = () => {
        // First remove all participants of this game
        const allParticipantsDeleted = Promise.all( this.state.participants.map( participant => { 
            return firebase.database().ref().child(`/participants/${participant.id}`).remove()
        }));

        // TODO: Delete turns if the game is started

        // Then delete the game itself
        allParticipantsDeleted.then((success) => {
            firebase.database().ref().child(`/games/${this.props.id}`).remove();
        });
    }

    join = () => {
        const { id } = this.state;
        const newParticipantKey = firebase.database().ref().child(`games/${id}/participants`).push().key;

        let participantData = {
            user : firebase.auth().currentUser.uid,
            ordinal : 0
        };
        let joinUpdate = {};
        joinUpdate[`games/${id}/participants/${newParticipantKey}`] = participantData; 
        firebase.database().ref().update(joinUpdate).then(() => {
            // Game participant creation success
            // TODO: Commit transaction
        
        }, (fail) => {
            // Game patricipant creation fail  
            // TODO: Roll back transaction
        });
    }

    startGame = () => {
        const { id, participants } = this.state;

        let startUpdate = {};
        startUpdate[`games/${id}/status/`] = Status.Started; 
        startUpdate[`games/${id}/nextTurner`] = participants[0].id; 
        firebase.database().ref().update(startUpdate).then(() => {
            // Game is started
        }, (fail) => {
            alert("An error occurred when attempting to start this game.");
        });
    }

    leave = () => {
        alert("TODO: Leave game");
    }

    resign = () => {
        alert("TODO: Resign");
    }

    getGameOptions(){
        let options = [];

        if (this.state.status == Status.NotStarted){
            if (this.state.isHost){
                options.push(new GameButton("btn-start", "icon-play", "Start", this.startGame));
                options.push(new GameButton("btn-cancel", "icon-cancel", "Cancel game", this.delete));
            }
            else if (this.state.myParticipant){
                options.push(new GameButton("btn-leave", "icon-cancel", "Leave game", this.leave));
            }
            else{
                options.push(new GameButton("btn-join", "icon-plus", "Join", this.join));
            }
        }
        else if (this.state.myParticipant){
            options.push(new GameButton("btn-resign", "icon-flag-empty", "Resign", this.resign));
        }

        return options;
    }

    printStatus = () => {
        switch(this.state.status){
            case Status.Finished:
                return "Finished";
            case Status.NotStarted:
                return "Not started";
            case Status.Started:
                return "Started";
            default:
                return "Unknown";
        }
    }

    render(){
        const { name, participants, id, myParticipant, nextTurner, latestTurn, status } = this.state;

        return (<div className="game">
            <div className="game-header">
                <div className="game-name">{name}</div>
                <div className="game-header-details">
                    <div className="game-status">{ this.printStatus() }</div>
                    <div className="game-participant-count">({participants.length} players)</div>
                    <div className="game-options">
                    { 
                        this.getGameOptions().map( option => { 
                            return (
                                <div key={ option.id } className="game-option" onClick= { () => { option.callback() } }> 
                                    <i className={ option.icon }></i><span className="label"> { option.title }</span> 
                                </div>
                            ) 
                        })
                    }
                    </div>
                </div>
            </div>
            <div className="game-details">
                <ol className="game-participant-list collapse" id={`#participants-list-${id}`}>
                    { participants.map( participant => {
                         return <li key={ participant.id }><Participant 
                            key={ participant.id } 
                            gameId= { id } 
                            data= { participant } 
                            isMe = { myParticipant && myParticipant.id == participant.id }
                            isNext = {nextTurner == participant.id } /> </li>
                        }) 
                    }
                </ol>

                { status == Status.Started && 
                    <Turn gameId={ id } 
                          turnId = { latestTurn } 
                          participantId = { nextTurner }
                          isMyTurn = { myParticipant && myParticipant.id == nextTurner } /> }
            </div>
        </div>);
    }
}
