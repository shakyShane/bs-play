import Rx = require('rx');
import * as path from 'path';
import * as fs from 'fs';
import {ParsedPath} from "path";

interface DirLookupOptions {
    cwd: string
}

export interface IDirLookup {
    userInput: string
    cwd: string
    resolved: string
    parsed: ParsedPath
}

export default function (userInput: string, options: DirLookupOptions): Rx.Observable<IDirLookup> {
    return Rx.Observable.from([].concat(userInput))
        .filter(Boolean)
        .map(userInput => [userInput, path.resolve(path.join(options.cwd, userInput))])
        .map(([userInput, resolved]) => {
            return {
                userInput,
                cwd: options.cwd,
                resolved,
                parsed: path.parse(resolved)
            }
        });
}