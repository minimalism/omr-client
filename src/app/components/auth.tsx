import React from 'react';

export class User {
    name : string;
    id : string;

    constructor(name : string, id : string){
        this.name = name;
        this.id = id;
    }
};

interface AuthProps {
    setUser : (User) => void;
};

export default class Auth extends React.Component<AuthProps, {}> {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <form action="/login" method="post">
                <label><b>Email</b></label>
                <input type="text" placeholder="Enter Email" name="email" required />
                <label><b>Password</b></label>
                <input type="password" placeholder="Enter Password" name="password" required />
                <input type="button" value="Login" onClick= { () => this.props.setUser(new User('Mata', '123')) } />
            </form>
        );    
    }
};