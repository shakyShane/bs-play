///<reference path="../node_modules/rx/ts/rx.all.d.ts"/>

declare module "net" {
    export interface Server {
        destroy(callback?: Function): void
    }
}