import React from 'react';

export default class GamesList extends React.Component<{}, {}> {

    render(){
        return (<Game />);
    }
}

class Game extends React.Component<{}, {}> {
    render(){
        return (<div>Here's a game innit</div>);
    }
}