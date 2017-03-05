"use strict";
var Rx = require("rx");
var http = require("http");
var destroy = require('server-destroy');
function bindHttp(app, port) {
    return Rx.Observable.create(function (observer) {
        var s = http.createServer(app).listen(port);
        destroy(s); // allow teardown of connections
        observer.onNext(s);
        return function () {
            s.destroy();
            console.log('tear down');
        };
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = bindHttp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZEh0dHAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZWZmZWN0cy9iaW5kSHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdUJBQThCO0FBQzlCLDJCQUFnQztBQUNoQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUUxQyxrQkFBa0MsR0FBRyxFQUFFLElBQUk7SUFDdkMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQUEsUUFBUTtRQUNoQyxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0M7UUFDNUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQixNQUFNLENBQUM7WUFDSCxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDWixPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQTtJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQzs7QUFWRCwyQkFVQyJ9