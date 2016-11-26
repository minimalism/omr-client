import React from 'react';
import Participant from './participant';
import {ParticipantData} from './participant';
import * as _ from 'lodash';
import * as Electron from 'electron';
import * as fs from 'fs';
import FormData from 'form-data';
import Config from '../config';

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

    constructor(public id : string){
    }
}

class GameOption{
    constructor(public id : string, public title : string, public callback : () => void){ }
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

            if (values.participants){
                state.participants = _.map(values.participants, (participant, id) => { return new ParticipantData(id, participant) });
            }
            else{
                state.participants = [];
            }

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

    submitTurn = () => {
        const cfg = new Config();

        Electron.remote.dialog.showOpenDialog({
            title: 'Please select a save file',
            defaultPath: cfg.getClientSettings().savesDir,
            filters: [ { name: 'Civ6 saves', extensions: ['Civ6Save'] } ],
            properties: ['openFile']
        }, (filePaths : string[]) => {
            if (filePaths && filePaths.length == 1) {
                const path = filePaths[0];
                let form = new FormData();
                form.append('gameId', this.state.id);
                form.append('participantId', this.state.myParticipant.id);
                form.append('file', fs.createReadStream(path));
                const { hostname, uploadPath, port } = new Config().getAPISettings();
                form.submit({
                    host: hostname,
                    path: uploadPath,
                    port: port
                }, (err, res) => {
                    if (err){
                        alert(`Could not upload turn: ${err.message}`);
                    }
                    else{
                        alert("Thanks");
                    }
                });
            }
        });
    }

    delete = () => {
        // First remove all participants of this game
        const allParticipantsDeleted = Promise.all( this.state.participants.map( participant => { 
            return firebase.database().ref().child(`/participants/${participant.id}`).remove()
        }));

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
                options.push(new GameOption("btn-start", "Start", this.submitTurn));
                options.push(new GameOption("btn-cancel", "Cancel game", this.delete));
            }
            else if (this.state.myParticipant){
                options.push(new GameOption("btn-leave", "Leave game", this.leave));
            }
            else{
                options.push(new GameOption("btn-join", "Join", this.join));
            }
        }
        else if (this.state.myParticipant){
            if (this.state.isMyTurn){
                options.push(new GameOption("btn-submit", "Submit turn", this.submitTurn));
            }
            options.push(new GameOption("btn-resign", "Resign", this.resign));
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

        return (<div className="game">
            <div className="game-header">
                <div className="game-name">{ this.state.name }</div>
                <div className="game-header-details">
                    <div className="game-status">{ this.printStatus() }</div>
                    <div className="game-participant-count">({ this.state.participants.length } players)</div>
                    <div className="game-options">
                    { 
                        this.getGameOptions().map( option => { 
                            return <button key={ option.id } className="game-option" onClick= { () => { option.callback() } }> { option.title } </button> 
                        })
                    }
                    </div>
                </div>
            </div>
            <div className="game-details">
                <ol className="game-participant-list">
                    { this.state.participants.map( participant => {
                         return <li key={ participant.id }><Participant 
                            key={ participant.id } 
                            gameId= { this.state.id } 
                            data= { participant } 
                            isMe = { this.state.myParticipant && this.state.myParticipant.id == participant.id }
                            isNext = {this.state.nextTurner == participant.id } /> </li>
                        }) 
                    }
                </ol>
            </div>
        </div>);
    }
}