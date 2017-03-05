import Rx     = require('rx');
import http   = require('http');
const destroy = require('server-destroy');

export default function bindHttp (app, port): Rx.Disposable {
    return Rx.Observable.create(observer => {
        const s = http.createServer(app).listen(port);
        destroy(s); // allow teardown of connections
        observer.onNext(s);
        return () => {
            s.destroy();
            console.log('tear down');
        }
    });
}