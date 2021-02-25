import { Application } from '@nodi/Seiryu';

const app = new Application();

bindYourAwesomeLibrary(app.http.raw);
app.http.listen(80);

// or use already bundled features like:

app.socket.listen(8181);
app.http.serveDirectory('/images');
app.dashboard.listen(8282);

// etc., more in documentation