import React from 'react';

export class User {
    name : string;
    email : string;
    id : string;

    constructor(fbUser : any){
        this.name = fbUser.displayName;
        if (!this.name) this.name = "Anonymous";
        this.id = fbUser.guid;
        this.email = fbUser.email;
    }
};

interface AuthProps {
    setUser : (User) => void;
    user : User;
};

class AuthState {
    email : string = '';
    password : string = '';
    remember : boolean = false;
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

    signOut = () => {
        firebase.auth().signOut().then(() => {
            this.props.setUser(null);   // Succesfully signed out
        }, this.displayError);
    }

    updateForm = (name) => (e) => {
        const state = this.state;
        state[name] = e.target.value;
        this.setState(state);
    }

    renderSignedIn = (user) => (
        <div className="auth-header">
            <h1>{`Welcome, ${user.name}!`}</h1>
            <button onClick={this.signOut}>Sign out</button>
        </div>);

    isValid = () => {
        return this.state.email && this.state.email.length > 0 && this.state.password && this.state.password.length > 0;
    }

    renderSignedOut() {
      return (
          <form className="auth-form">
              <input className="email" type="text" placeholder="Enter Email" value={this.state.email} onChange={this.updateForm('email')} name="email" required />
              <input className="password" type="password" placeholder="Enter Password" value={this.state.password} onChange={this.updateForm('password')} name="password" required />
              <input className="login" type="button" value="Login" disabled={!this.isValid()} onClick= { () => this.signIn() } />
              <input className="login" type="button" value="Register" disabled={!this.isValid()} onClick= { () => this.register() } />
          </form>
      );
    }

    render() {
        const { user } = this.props;
        return user ? this.renderSignedIn(user) : this.renderSignedOut();
    }
};
