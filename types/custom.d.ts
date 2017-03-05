declare module "net" {
    export interface Server {
        destroy(callback?: Function): void
    }
}