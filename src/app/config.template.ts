export default class Config {

    public getFirebaseSettings(){
        return  {
            apiKey: "",
            authDomain: "",
            databaseURL: "",
            storageBucket: "",
            messagingSenderId: ""
        }
    };

    public getAPISettings(){
        return {
            hostname : 'localhost',
            post : 8000
        }
    };
};