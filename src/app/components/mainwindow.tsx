import React from 'react';
import ReactDOM from 'react-dom';
import {User} from './auth';
import Auth from './auth';
import GamesList from './gamelist';

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

    setUser = (user : User) => this.setState({ user });

    render() {
        const { user } = this.state;
        return (
          <div className="main-window">
            <Auth setUser={this.setUser} user={user} />
            { user && <GamesList />}
          </div>
        )
    }
};
