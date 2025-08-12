/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { DisposableStore } from '../../../../../base/common/lifecycle.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { Selection } from '../../../../common/core/selection.js';
import { Position } from '../../../../common/core/position.js';
import { Range } from '../../../../common/core/range.js';
import { EditorAction } from '../../../../browser/editorExtensions.js';
import { ICodeEditor } from '../../../../browser/editorBrowser.js';
import { withTestCodeEditor } from '../../../../test/browser/testCodeEditor.js';
import { createTextModel } from '../../../../test/common/model/textModel.js';
import { TestLanguageConfigurationService } from '../../../../test/common/modes/testLanguageConfigurationService.js';
import { ILanguageConfigurationService } from '../../../../common/languages/languageConfigurationRegistry.js';

suite('Editor Contrib - Auto Comment Action', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('should detect function declaration', () => {
		const disposables = new DisposableStore();
		const languageId = 'javascript';
		const serviceCollection = new Map();
		serviceCollection.set(ILanguageConfigurationService, TestLanguageConfigurationService);

		const model = createTextModel([
			'function calculateSum(a, b) {',
			'    return a + b;',
			'}'
		].join('\n'), languageId, {});
		disposables.add(model);

		withTestCodeEditor(model, { serviceCollection }, (editor) => {
			// Position cursor at the function declaration line
			editor.setPosition(new Position(1, 1));
			
			// Trigger auto comment action
			const actions = editor.getSupportedActions().filter(a => a.id === 'editor.action.autoComment');
			assert.strictEqual(actions.length, 1, 'Auto comment action should be available');
			
			const action = actions[0];
			action.run();
			
			// Check if comment was added
			const modelContent = model.getValue();
			const lines = modelContent.split('\n');
			
			// The comment should be added above the function
			assert.ok(lines[0].includes('// Function: calculateSum'), 'Should add function comment');
		});
	});

	test('should detect variable declaration', () => {
		const disposables = new DisposableStore();
		const languageId = 'javascript';
		const serviceCollection = new Map();
		serviceCollection.set(ILanguageConfigurationService, TestLanguageConfigurationService);

		const model = createTextModel([
			'const userName = "John Doe";'
		].join('\n'), languageId, {});
		disposables.add(model);

		withTestCodeEditor(model, { serviceCollection }, (editor) => {
			// Position cursor at the variable declaration line
			editor.setPosition(new Position(1, 1));
			
			// Trigger auto comment action
			const actions = editor.getSupportedActions().filter(a => a.id === 'editor.action.autoComment');
			assert.strictEqual(actions.length, 1, 'Auto comment action should be available');
			
			const action = actions[0];
			action.run();
			
			// Check if comment was added
			const modelContent = model.getValue();
			const lines = modelContent.split('\n');
			
			// The comment should be added above the variable
			assert.ok(lines[0].includes('// Variable: userName'), 'Should add variable comment');
		});
	});

	test('should handle code selection', () => {
		const disposables = new DisposableStore();
		const languageId = 'javascript';
		const serviceCollection = new Map();
		serviceCollection.set(ILanguageConfigurationService, TestLanguageConfigurationService);

		const model = createTextModel([
			'if (condition) {',
			'    doSomething();',
			'}'
		].join('\n'), languageId, {});
		disposables.add(model);

		withTestCodeEditor(model, { serviceCollection }, (editor) => {
			// Select the entire if block
			editor.setSelection(new Selection(1, 1, 3, 2));
			
			// Trigger auto comment action
			const actions = editor.getSupportedActions().filter(a => a.id === 'editor.action.autoComment');
			assert.strictEqual(actions.length, 1, 'Auto comment action should be available');
			
			const action = actions[0];
			action.run();
			
			// Check if comment was added
			const modelContent = model.getValue();
			const lines = modelContent.split('\n');
			
			// The comment should be added above the selection
			assert.ok(lines[0].includes('// Code block (3 lines)'), 'Should add selection comment');
		});
	});
});