'use strict';

const UnpublishCommand = require('../../commands/unpublish-command');
const UnpublishHandler = require('../../utils/unpublish-handler');
const Command = require('../../commands/command');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: unpublish', () => {

    const fakeError = 'fakeError';

    let authHandler,
        command,
        setArgsStub,
        fetchProjectsStub,
        askForProjectNameStub,
        confirmSelectionStub,
        unpublishStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new UnpublishCommand(authHandler);
        setArgsStub = sandbox.stub(UnpublishHandler.prototype, 'setArgs');
        fetchProjectsStub = sandbox.stub(UnpublishHandler.prototype, 'fetchProjects');
        askForProjectNameStub = sandbox.stub(UnpublishHandler.prototype, 'askForProjectName');
        confirmSelectionStub = sandbox.stub(UnpublishHandler.prototype, 'confirmSelection');
        unpublishStub = sandbox.stub(UnpublishHandler.prototype, 'unpublish');
        printStub = sandbox.stub(Command.prototype, 'print');
        catchErrorStub = sandbox.stub(Command.prototype, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(UnpublishHandler);
    });

    it('should have assigned authHandler even though it is not specified', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new UnpublishCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should call handler methods in expected order', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        confirmSelectionStub.resolves();
        unpublishStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, confirmSelectionStub, unpublishStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should catch error if fetchProjects() method rejects', async () => {

        fetchProjectsStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, catchErrorStub);
        sandbox.assert.notCalled(askForProjectNameStub);
        sandbox.assert.notCalled(unpublishStub);
        sandbox.assert.notCalled(printStub);
    });

    it('should catch error if askForProjectName() method rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, catchErrorStub);
        sandbox.assert.notCalled(unpublishStub);
        sandbox.assert.notCalled(printStub);
    });

    it('should catch error if unpublish() method rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        unpublishStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, unpublishStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });
});
