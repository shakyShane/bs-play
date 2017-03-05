import Rx      = require('rx');
import connect = require('connect');
import serve   = require('serve-static');
import bindHttp from './effects/bindHttp';
import getDirs  from './reads/dir$';

interface BsConfig {
    port?: number
    serveStatic?: string
}

interface BsOptions {
    port: number
}

interface Reads {
    port$?: Rx.Observable<number>
    dir$?: Rx.Observable<string>
}

interface ServeStatic {
    route: string
    dir: string
    options: any
}

interface Effects {
    bindHttp?(app, port): Rx.Disposable
}

function getServeStatic(dir, options): ServeStatic {
    return {route: '/', dir, options};
}

const log = (name) => (x) => console.log('-->', name, x);

function bs(config: BsConfig, reads: Reads, effects: Effects): Rx.Observable<BsOptions> {

    const $dirs  = getDirs(config.serveStatic, {cwd: './'});
    const ss$    = reads.dir$.map(dir => getServeStatic(dir, {}));
    const server = reads
        .port$
        .zip(ss$.toArray(), (port, ss) => ({port, ss}))
        // .do(log('2'))
        .flatMap(incoming => {
            const app = connect();
            incoming.ss.forEach((ss: ServeStatic) => app.use('/', serve(ss.dir, ss.options)));
            return effects.bindHttp(app, incoming.port);
        });

    return Rx.Observable.concat(server);
}
    

const sub = bs(
    {
        serveStatic: './'
    },
    {
        port$: Rx.Observable.of(3000),
        dir$:  Rx.Observable.of('/Users/shakyshane/sites/oss/bs-play/fixtures')
    },
    {bindHttp}
    )
    .subscribe(x => console.log(x.address()));

// setTimeout(() => sub.dispose(), 5000);

