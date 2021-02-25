import { Application } from '@nodi/Seiryu';
import { router } from './router.ts'
import './controllers/home.ts';

const app = new Application();

app.bindRouter(router);
app.http.listen(80);