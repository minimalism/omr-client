import React from 'react';

export class User {
    name : string;
    email : string;
    id : string;

    constructor(fbUser : any){
        this.name = fbUser.name;
        this.id = fbUser.guid;
        this.email = fbUser.email;
    }
};

interface AuthProps {
    setUser : (User) => void;
};

class AuthState {
    email : string;
    password : string;
    remember : boolean;
}

export default class Auth extends React.Component<AuthProps, AuthState> {

    constructor(props) {
        super(props);

        this.state = new AuthState();
        firebase.auth().onAuthStateChanged(function(fbUser) {
            if (fbUser) {
                this.props.setUser(new User(fbUser));
            } else {
                this.props.setUser(null);
            }
        }.bind(this));
    }

    displayError(error : Error){
        alert(error.message);
    }

    register(){
        firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password).catch(this.displayError);
    }

    signIn(){
        firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password).catch(this.displayError);
    }

    signOut(){
        firebase.auth().signOut().then(() => {
            this.props.setUser(null);   // Succesfully signed out
        }, this.displayError);
    }

    updateEmail(e){
        var state = this.state;
        state.email = e.target.value;
        this.setState(state);
    }

    updatePassword(e){
        var state = this.state;
        state.password = e.target.value;
        this.setState(state);
    }

    render() {
        return (
            <form>
                <label><b>Email</b></label>
                <input type="text" placeholder="Enter Email" value= { this.state.email } onChange = { this.updateEmail.bind(this) } name="email" required />
                <label><b>Password</b></label>
                <input type="password" placeholder="Enter Password" value= { this.state.password } onChange = { this.updatePassword.bind(this) } name="password" required />
                <input type="button" value="Login" onClick= { () => this.signIn() } />
                <input type="button" value="Register" onClick= { () => this.register() } />
            </form>
        );    
    }
};