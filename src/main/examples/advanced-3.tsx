import { Controller, asAction } from '../router.ts';

class HomeController extends Controller('home') {
    @asAction('home', {
        path: '*'
    })
    home() {
        return 'Hello world!';
    }
}