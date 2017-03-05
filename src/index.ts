import Rx      = require('rx');
import connect = require('connect');
import serve   = require('serve-static');
import bindHttp from './effects/bindHttp';
import getDirs  from './reads/dir$';
import {IDirLookup} from "./reads/dir$";

function getServeStatic(dir, options): ServeStatic {
    return {route: '/', dir, options};
}

const log = (name) => (x) => console.log('-->', name, x);

const defaults = {
    port: 3000
};

// convert options to streams
const converters = {
    port: function (value: number): Rx.Observable<OptionDefinition> {
        return Rx.Observable.of({
            option: value
        });
    },
    serveStatic: function createStreamOfServeStaticMiddlewares(input): Rx.Observable<OptionDefinition> {
        return getDirs(input, {cwd: process.cwd()})
            .map((dir: IDirLookup) => {
                return {
                    option: dir,
                    middleware: {
                        handle: serve(dir.resolved, {}),
                        route: '/'
                    }
                }
            })
            .toArray()
            .map((items) => {
                return {
                    option: items.map(x => x.option),
                    middleware: items.map(x => x.middleware)
                }
            })
    }
};

function getStreams (converters, config, defaults) {
    return Object.keys(converters).reduce(function (acc, key) {

        const configValue  = config[key];
        const defaultValue = defaults[key];

        if (typeof configValue !== "undefined") {
            return acc.concat({
                key: key,
                output$: converters[key]
                    .call(null, configValue)
                    .map(output => {
                        return {key, output}
                    })
            });
        }

        return acc.concat({
            key: key,
            output$: converters[key]
                .call(null, defaultValue)
                .map(output => {
                    return {key, output}
                })
        });

    }, []);
}

function bs(config: BsConfig, reads: Reads, effects: Effects) {

    const userInput$ = new Rx.BehaviorSubject(config);

    const updates = userInput$
        .map(input => {
            return getStreams(converters, input, defaults);
        })
        .flatMap(streams => {
            return Rx.Observable.combineLatest.apply(Rx.Observable, streams.map(x => x.output$));
        });

    const optionUpdates = updates
        .map(items => {
            return items.reduce((acc, item) => {
                acc[item.key] = item.output.option;
                return acc;
            }, {});
        });

    const middlewareUpdates = updates
        .map(items => {
            return items.reduce((acc, item) => {
                if (item.output.middleware) {
                    return acc.concat(item.output.middleware)
                }
                return acc;
            }, []);
        });

    Rx.Observable.interval(5000).map(x => {
        console.log(4000 + x + 1);
        userInput$.onNext({
            port: 4000 + x + 1 // todo smarter options merging (keep track of current etc)
        });
    }).subscribe();

    return middlewareUpdates
        .withLatestFrom(optionUpdates)
        .flatMapLatest(([middleware, options]) => {
            const app = connect();
            middleware.forEach(mw => app.use(mw.route, mw.handle));
            return effects.bindHttp(app, options.port);
        });
}

const sub = bs(
    {
        serveStatic: ['./', 'fixtures'],
        port: 4000
    },
    {
        port$: Rx.Observable.of(3000),
        dir$: Rx.Observable.of('/Users/shakyshane/sites/oss/bs-play/fixtures')
    },
    {bindHttp}
);

sub.subscribe(x => {
    // console.log(x);
})

// setTimeout(() => sub.dispose(), 5000);

interface BsConfig {
    port?: number
    serveStatic?: string|string[]|ServeStatic
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

interface MiddlewareDefinition {
    route: string
    handle: Function
    id?: string
}

interface IError {
    type: string
}

interface OptionConverterOutput {
    key: string
    output: Rx.Observable<OptionDefinition>
}

interface OptionDefinition {
    option: any
    middleware?: MiddlewareDefinition[]
    errors?: IError
}

interface Effects {
    bindHttp?(app, port): Rx.Observable<any>
}