import React from 'react';
import ReactDOM from 'react-dom';
import {User} from './auth';
import Auth from './auth';
import GamesList from './games';

export default class App {
    display(){
        ReactDOM.render(
            <MainWindow />,
            document.getElementById('content')
        );
    }
};

class AppState {
    user : User;
};

class MainWindow extends React.Component<{}, AppState> {

    constructor(props) {
        super(props);
        this.state = new AppState();
    }

    setUser(user : User){
        this.setState({ user });
    }

    render() {
        if (this.state.user){
            return (
                <div>
                    <h1>Welcome, { this.state.user.name }!</h1>
                    <GamesList />
                </div>
            );
        }
        else{
            return <Auth setUser = { (user : User) => this.setUser(user) } />;    
        }
    }
};

