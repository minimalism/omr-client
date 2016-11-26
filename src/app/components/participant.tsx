import React from 'react';


export class ParticipantData {
    userId : string;

    constructor(public id : any, data : any){
        this.userId = data.user;
    }
}

interface ParticipantProps {
    gameId : string;
    data : ParticipantData;
    isNext : boolean,
    isMe : boolean;
}

class ParticipantState {

    name : string = "Anonymous";

    constructor(public participant : ParticipantData){

    }
}

export default class Participant extends React.Component<ParticipantProps, ParticipantState> {

    constructor(props){
        super(props);
        this.state = new ParticipantState(this.props.data);
    }

    participantDataChanged = (data) =>{
        var value = data.val();
        if (value){
            var state = this.state;
            state.participant.userId = value.user;
            this.setState(state);
        }
    }

    componentWillMount(){
        firebase.database().ref().child(`games/${this.props.gameId}/participants/${this.state.participant.id}`).on('value', this.participantDataChanged);
    }

    componentWillUnmount(){
        firebase.database().ref().child(`games/${this.props.gameId}/participants/${this.state.participant.id }`).off();
    }    

    render(){
        return (
            <div className="participant"> 
            <div className="participant-name">{ this.state.name }</div> 
            { this.props.isMe && <div className="participant-detail">(Me)</div> }
            { this.props.isNext && <div className="participant-detail">Current turn</div> }
            </div>
        );
    }
}