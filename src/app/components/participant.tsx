import React from 'react';

interface ParticipantProps {
    id : string;
}

class ParticipantState {

    userId : string;

    constructor(public id : string){

    }
}

export default class Participant extends React.Component<ParticipantProps, ParticipantState> {

    constructor(props){
        super(props);

        this.state = new ParticipantState(this.props.id);
    }

    participantDataChanged(data){
        var value = data.val();
        if (value){
            var state = this.state;
            state.userId = value.user;
            this.setState(state);
        }
    }

    componentWillMount(){
        firebase.database().ref().child('/participants/' + this.props.id ).on('value', this.participantDataChanged.bind(this));
    }

    componentWillUnmount(){
        firebase.database().ref().child('/participants/' + this.props.id).off();
    }    

    render(){
        return (<div className="participant"> { this.state.userId } </div>);
    }
}