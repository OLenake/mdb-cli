'use strict';

const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');
const VersionHandler = require('../utils/version-handler');

class VersionCommand extends Command {

    constructor(authHandler = new AuthHandler(false)) {

        super(authHandler);
        this.handler = new VersionHandler(authHandler);
    }

    execute() {

        this.handler.loadPackageManager()
            .then(() => this.handler.printVersion())
            .catch(e => this.catchError(e));
    }
}

module.exports = VersionCommand;
