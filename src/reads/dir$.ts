import Rx = require('rx');
import * as path from 'path';

interface DirLookupOptions {
    cwd: string
}

export default function (userInput: string, options: DirLookupOptions)
    : Rx.Observable<string> {
    const lookups = []
        .concat(userInput)
        .map(x => {
            if (typeof x === 'string') {
                return {
                    dir: x,
                    route: '/',
                    options: {}
                }
            }
        });
}