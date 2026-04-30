"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedRemote = exports.updateRemoteCommands = exports.getCommandsByCategory = exports.getCommandById = exports.getCommands = exports.reloadCommands = exports.loadCommands = void 0;
// myterminal/src/data/index.ts
var loader_1 = require("./loader");
Object.defineProperty(exports, "loadCommands", { enumerable: true, get: function () { return loader_1.loadCommands; } });
Object.defineProperty(exports, "reloadCommands", { enumerable: true, get: function () { return loader_1.reloadCommands; } });
Object.defineProperty(exports, "getCommands", { enumerable: true, get: function () { return loader_1.getCommands; } });
Object.defineProperty(exports, "getCommandById", { enumerable: true, get: function () { return loader_1.getCommandById; } });
Object.defineProperty(exports, "getCommandsByCategory", { enumerable: true, get: function () { return loader_1.getCommandsByCategory; } });
var updater_1 = require("./updater");
Object.defineProperty(exports, "updateRemoteCommands", { enumerable: true, get: function () { return updater_1.updateRemoteCommands; } });
Object.defineProperty(exports, "getCachedRemote", { enumerable: true, get: function () { return updater_1.getCachedRemote; } });
//# sourceMappingURL=index.js.map