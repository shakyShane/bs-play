import Rx     = require('rx');
import http   = require('http');
import {Server} from "http";
const destroy = require('server-destroy');

export default function bindHttp (app, port): Rx.Observable<any> {
    return Rx.Observable.create(observer => {
        console.log('setup on bindHttp', port);
        const s = http.createServer(app).listen(port);
        destroy(s); // allow teardown of connections
        observer.onNext(s);
        return () => {
            s.destroy();
            console.log('tear down from bindHttp');
        }
    });
}