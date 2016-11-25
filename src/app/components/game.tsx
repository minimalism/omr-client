import React from 'react';
import Participant from './participant';
import _ from 'lodash';
import Electron from 'electron';
import fs from 'fs';
import FormData from 'form-data';
import Config from '../config';

interface GameProperties {
    id : string;
}

class GameData {
    name : string;
    host : string;
    status : number;
    participants : string[] = [];

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
        var state = this.state;

        var values = data.val();
        if (values){
            state.host = values.host;
            state.name = values.name;
            state.status = values.status;
            if (values.participants){
                state.participants = values.participants.map( participant => { return participant.participant; } );
            }
            else{
                state.participants = [];
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

    submitTurn = (path : string) => {
        const currentUserId = firebase.auth().currentUser.uid;

        let form = new FormData();
        form.append('game', this.state.id);
        form.append('user', currentUserId);
        form.append('file', fs.createReadStream(path));
        const { hostname, uploadPath, port }= new Config().getAPISettings();
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

    start = () => {
        const cfg = new Config();

        Electron.remote.dialog.showOpenDialog({
            title: 'Please select a save file',
            defaultPath: cfg.getClientSettings().savesDir,
            filters: [ { name: 'Civ6 saves', extensions: ['Civ6Save'] } ],
            properties: ['openFile']
        }, (filePaths : string[]) => {
            if (filePaths && filePaths.length == 1) {
                this.submitTurn(filePaths[0]);
            }
        });
    }

    delete = () => {
        // First remove all participants of this game
        const allParticipantsDeleted = Promise.all( this.state.participants.map( participant => {
            return firebase.database().ref().child(`/participants/${participant}`).remove()
        }));

        // Then delete the game itself
        allParticipantsDeleted.then((success) => {
            firebase.database().ref().child(`/games/${this.props.id}`).remove();
        });
    }

    join = () => {
        alert("Joining game");
    }

    leave = () => {
        alert("Leaving game");
    }

    getGameOptions(){
        const currentUserId = firebase.auth().currentUser.uid;
        const isHost = this.state.host == currentUserId;
        const isParticipant = this.state.participants.some( participant => participant == currentUserId );

        let options = [];

        if (isHost){
            options.push(new GameOption("btn-start", "Start game", this.start));
            options.push(new GameOption("btn-cancel", "Cancel game", this.delete));
        }
        else if (isParticipant){
            options.push(new GameOption("btn-leave", "Leave game", this.leave));
        }
        else{
            options.push(new GameOption("btn-join", "Join game", this.join));
        }

        return options;
    }

    render(){

        return (<div className="game">
            <div className="game-header">
                <div className="game-name">{ this.state.name }</div>
                <div className="game-participant-count">({ this.state.participants.length } players)</div>
                <div className="game-options">
                {
                    this.getGameOptions().map( option => {
                        return <button key={ option.id } className="game-option" onClick= { () => { option.callback() } }> { option.title } </button>
                    } )
                }
                </div>
            </div>
            <div className="game-details">
                <div className="game-participant-list">
                    { this.state.participants.map( participantId => { return <Participant key={ participantId } id= { participantId }/> } ) }
                </div>
            </div>
        </div>);
    }
}
