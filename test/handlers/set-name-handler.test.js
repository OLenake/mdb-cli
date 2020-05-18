'use strict';

const handlerClass = require('../../utils/set-name-handler');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Handler: set-name', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have `result` property', () => {

        expect(handler).to.have.property('result');
    });

    it('should `result` be an array', () => {

        expect(handler.result).to.be.a('array');
    });

    it('should have `oldName` property', () => {

        expect(handler).to.have.property('oldName');
    });

    it('should `oldName` be string', () => {

        expect(handler.oldName).to.be.a('string');
    });

    it('should have `authHandler` property', () => {

        expect(handler).to.have.property('authHandler');
    });

    it('should have assigned authHandler', () => {

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned authHandler if not specified in constructor', (done) => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new handlerClass();
        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should createPromptModule() be invoked in askForNewProjectName() invoke', async () => {

        const inquirer = require('inquirer');
        const promptStub = sandbox.stub().resolves({ name: 'stub' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(promptStub.called === false, 'promptStub.called shouldn\'t be called');
        await handler.askForNewProjectName();
        expect(promptStub.called === true, 'promptStub.called should be called');
    });

    it('should askForNewProjectName() return expected result', async () => {

        const inquirer = require('inquirer');
        const expectedResult = 'stub';

        const promptStub = sandbox.stub().resolves({ name: expectedResult });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(handler.name !== expectedResult, 'handler.name should have different name from expectedResult');
        await handler.askForNewProjectName();
        expect(handler.name === expectedResult, 'handler.name should have the same name as expectedResult');
    });

    it('should reject if old and new name are the same', async () => {

        const deserializer = require('../../helpers/deserialize-object-from-file');
        const serializer = require('../../helpers/serialize-object-to-file');
        const newName = 'fakeName';
        const oldName = 'fakeName';
        handler.newName = newName;
        sandbox.stub(serializer, 'serializeJsonFile').rejects();
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ name: oldName });
        const expectedResults = { 'Status': CliStatus.SUCCESS, 'Message': 'Project names are the same.' };
        sandbox.stub(console, 'log');

        expect(handler.result).to.be.an('array').that.is.empty;

        try {

            await handler.setName();
        } catch (err) {

            expect(err).to.deep.include(expectedResults);
        }
    });

    it('should setName() change project name', async () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const newName = 'newName';
        const oldName = 'oldName';
        const expectedResults = { 'Status': CliStatus.SUCCESS, 'Message': `Project name has been successfully changed from ${oldName} to ${newName}.` };

        const promptStub = sandbox.stub().resolves({ name: newName });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ name: oldName });

        handler.newName = newName;
        expect(handler.result).to.be.an('array').that.is.empty;

        try {

            await handler.setName();
        } catch (err) {

            expect(err).to.deep.include(expectedResults);
        }
    });

    it('should return expected result if problem with file deserialization', async () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'name';
        const fileName = 'package.json';
        const expectedResults = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}` };

        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').rejects(fakeError);
        sandbox.stub(console, 'log');

        try {

            handler.name = name;
            await handler.setName();

        } catch (err) {

            expect(err).to.deep.include(expectedResults);
        }
    });

    it('should return expected result if problem with file serialization', async () => {

        const fs = require('fs');
        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'name';
        const oldName = 'oldName';
        const fileName = 'package.json';
        const expectedResults = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}` };
        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').rejects(fakeError);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ name: oldName });
        sandbox.stub(fs, 'writeFile');
        sandbox.stub(console, 'log');

        try {

            handler.oldName = oldName;
            handler.newName = name;
            await handler.setName();

        } catch (err) {

            expect(err).to.deep.include(expectedResults);
        }
    });

    it('should removeProject() call HttpWrapper.delete() function', async () => {

        const config = require('../../config');
        sandbox.stub(config, 'port').value('fakePort');
        sandbox.stub(config, 'host').value('fakeHost');
        const HttpWrapper = require('../../utils/http-wrapper');
        const deleteStub = sandbox.stub(HttpWrapper.prototype, 'delete');

        await handler.removeProject();
        expect(deleteStub.calledOnce).to.be.true;
    });
});
