import { Application } from '@nodi/Seiryu';

const app = new Application();

app.route('*'. () => 'Hello world');
app.listen(80);
