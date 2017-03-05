import Rx      = require('rx');
import connect = require('connect');
import serve   = require('serve-static');
import bindHttp from './effects/bindHttp';
import getDirs  from './reads/dir$';
import {IDirLookup} from "./reads/dir$";

const defaults = {
    port: 3000
};

/**
 * The role of a 'converter' is to take user input, such as a string from
 * configuration, and produce a stream of <OptionDefinition> values. Every converter
 * is ALWAYS called, but it may be called with user input (if they provided a matching key name)
 * or it may be called with a default value (if this item requires it) or it may be
 * called with nothing.
 *
 * RE: errors - a converter can 'throw' by returning an Rx.Observable.throw for errors that
 * cannot be recovered from (such as an unavailable port), alternatively an array of non-fatal
 * errors can be returned to allow things such as improved UX ) for validating types etc
 */
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

/**
 * Take the converters, userInput and defaults and produce an array
 * of lazy streams that have {key, output$} - where `key` is the
 * top level option name, and output$ is a stream of values it will
 * produce in the future.
 */
function getStreams (converters, userInput, defaults) {
    return Object.keys(converters).reduce(function (acc, key) {

        const userInputValue  = userInput[key];
        const defaultValue    = defaults[key];

        const valueToUse   = (typeof userInputValue !== "undefined")
            ? userInputValue
            : defaultValue;

        return acc.concat({
            key: key,
            output$: converters[key]
                .call(null, valueToUse)
                .map(output => {
                    return {key, output}
                })
        });

    }, []);
}

function bs(config: BsConfig, reads: Reads, effects: Effects) {

    /**
     * Create a stream representing the user input
     * this could be pushed onto at a later time
     * which would cause all options/middlewares to be re-processed
     */
    const userInput$ = new Rx.BehaviorSubject(config);

    /**
     * Combine ALL of the the output$ streams and produce
     * all of them whenever 1 changes
     * @type {Rx.Observable<TResult>}
     */
    const updates = userInput$
        .map(input => {
            return getStreams(converters, input, defaults);
        })
        .flatMap(streams => {
            return Rx.Observable.combineLatest.apply(Rx.Observable, streams.map(x => x.output$));
        });

    /**
     * A stream of option only updates
     * @type {Rx.Observable<any>}
     */
    const optionUpdates = updates
        .map(items => {
            return items.reduce((acc, item) => {
                acc[item.key] = item.output.option;
                return acc;
            }, {});
        });

    /**
     * A steam of middleware only updates
     * @type {Rx.Observable<any>}
     */
    const middlewareUpdates = updates
        .map(items => {
            return items.reduce((acc, item) => {
                if (item.output.middleware) {
                    return acc.concat(item.output.middleware)
                }
                return acc;
            }, []);
        });

    /**
     * return a stream of middleware updates
     * that cause effects to occur (such as binding to a http server etc)
     *
     * The idea is that this entire program is composed in a way that allows
     * new user input to be accepting whilst running and it knows how to
     * teardown/setup new resources to handle that.
     */
    return middlewareUpdates
        .withLatestFrom(optionUpdates)
        .flatMapLatest(([middleware, options]) => {
            const app = connect();
            middleware.forEach(mw => app.use(mw.route, mw.handle));
            return effects.bindHttp(app, options.port);
        });
}

/**
 * Exercise the API
 * @type {Rx.Observable<TResult>}
 */
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