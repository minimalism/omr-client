import * as fb from "firebase";
import Config from "./config";
import App from './components/mainwindow';

const cfg = new Config();

fb.firebase.initializeApp(cfg.getFirebaseSettings());

const app = new App();

app.display();