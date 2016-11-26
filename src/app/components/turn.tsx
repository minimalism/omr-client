import React from 'react';
import Config from '../config';
import Electron from 'electron';
import fs from 'fs';
import FormData from 'form-data';
import http from 'http';
import {GameButton} from './game';

class TurnState {
    fileId : string;
}

interface TurnProps {
    gameId : string;
    turnId : number;
    participantId : string;
    isMyTurn : boolean;
}

export default class Turn extends React.Component<TurnProps, TurnState> {

    constructor(props){
        super(props);
        this.state = new TurnState(); 
    }
    
    turnDataChanged = (data) => {
        const state = this.state;
        const values = data.val();
        if (values){
            state.fileId = values.fileId;
        }
        this.setState(state);
    }

    componentWillMount(){
        firebase.database().ref().child(`/turns/${this.props.gameId}/${this.props.turnId}`).on('value', this.turnDataChanged);
    }

    componentWillUnmount(){
        firebase.database().ref().child(`/turns/${this.props.gameId}/${this.props.turnId}`).off();
    }

    downloadTurn = () => {
        const cfg = new Config();
        const { fileId } = this.state;

        if (!fileId) {
            alert("No savefile specified.");
        }
        else{
            Electron.remote.dialog.showSaveDialog({
                title: 'Please select a download location',
                defaultPath: cfg.getClientSettings().savesDir,
                filters: [ { name: 'Civ6 saves', extensions: ['Civ6Save'] } ],
                buttonLabel: 'Download savefile'
            }, (path : string) => {
                if (path) {

                    const { hostname, downloadPath, port } = new Config().getAPISettings();
                    const request = http.get({
                        host: hostname,
                        port: port,
                        path: `${downloadPath}${fileId}`
                    }, (res : http.IncomingMessage) => {
                        if (res.statusCode !== 200){
                            alert(`Request failed: ${res.statusCode}`);
                        }
                        else{
                            const file = fs.createWriteStream(path);
                            res.pipe(file);
                        }
                    });
                }
            });
        }
    }

    submitTurn = () => {
        const cfg = new Config();

        Electron.remote.dialog.showOpenDialog({
            title: 'Please select a save file',
            defaultPath: cfg.getClientSettings().savesDir,
            buttonLabel: 'Upload savefile',
            filters: [ { name: 'Civ6 saves', extensions: ['Civ6Save'] } ],
            properties: ['openFile']
        }, (filePaths : string[]) => {
            if (filePaths && filePaths.length == 1) {
                const path = filePaths[0];
                let form = new FormData();
                form.append('gameId', this.props.gameId);
                form.append('participantId', this.props.participantId);
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

    getTurnOptions = () => {
        let options = [];
        if (this.props.isMyTurn){
            if (this.state.fileId){
                options.push(new GameButton("btn-download", "icon-download-cloud", "Download turn", this.downloadTurn));
            }
            options.push(new GameButton("btn-submit", "icon-upload-cloud", "Submit turn", this.submitTurn));
        }
        return options;
    }

    render(){
        const turnNumber = this.props.turnId == undefined ? -1 : this.props.turnId;  
        return <div className="turn"><div className="turnName">Turn #{ turnNumber+1 }</div>
        { 
            this.getTurnOptions().map( option => { 
                return (
                    <div key={ option.id } className="game-option" onClick= { () => { option.callback() } }> 
                        <i className={ option.icon }></i><span className="label"> { option.title }</span> 
                    </div>
                ) 
            })
        }
        </div>
    }
}
