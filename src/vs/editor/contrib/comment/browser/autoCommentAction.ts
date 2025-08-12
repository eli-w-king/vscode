/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { ICodeEditor } from '../../../browser/editorBrowser.js';
import { EditorAction, registerEditorAction, ServicesAccessor } from '../../../browser/editorExtensions.js';
import { Position } from '../../../common/core/position.js';
import { Range } from '../../../common/core/range.js';
import { ITextModel } from '../../../common/model.js';
import { EditorContextKeys } from '../../../common/editorContextKeys.js';
import { ILanguageConfigurationService } from '../../../common/languages/languageConfigurationRegistry.js';
import * as nls from '../../../../nls.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';

class AutoCommentAction extends EditorAction {

	constructor() {
		super({
			id: 'editor.action.autoComment',
			label: nls.localize2('comment.auto', "Generate Comment"),
			precondition: EditorContextKeys.writable,
			kbOpts: {
				kbExpr: EditorContextKeys.editorTextFocus,
				primary: KeyMod.Alt | KeyCode.KeyG,
				weight: KeybindingWeight.EditorContrib
			}
		});
	}

	public run(accessor: ServicesAccessor, editor: ICodeEditor): void {
		const languageConfigurationService = accessor.get(ILanguageConfigurationService);

		if (!editor.hasModel()) {
			return;
		}

		const model = editor.getModel();
		const selection = editor.getSelection();

		if (!selection || selection.isEmpty()) {
			// If no selection, try to detect current line or function
			this.generateCommentForCurrentContext(model, selection.getStartPosition(), languageConfigurationService, editor);
		} else {
			// Generate comment for selected code
			this.generateCommentForSelection(model, selection, languageConfigurationService, editor);
		}
	}

	private generateCommentForCurrentContext(model: ITextModel, position: Position, languageConfigurationService: ILanguageConfigurationService, editor: ICodeEditor): void {
		const line = model.getLineContent(position.lineNumber);
		const trimmedLine = line.trim();

		let comment = '';

		// Detect function declarations
		if (this.isFunctionDeclaration(trimmedLine)) {
			const functionName = this.extractFunctionName(trimmedLine);
			comment = `// ${functionName ? `Function: ${functionName}` : 'Function definition'}`;
		}
		// Detect variable declarations
		else if (this.isVariableDeclaration(trimmedLine)) {
			const variableName = this.extractVariableName(trimmedLine);
			comment = `// ${variableName ? `Variable: ${variableName}` : 'Variable declaration'}`;
		}
		// Detect class declarations
		else if (this.isClassDeclaration(trimmedLine)) {
			const className = this.extractClassName(trimmedLine);
			comment = `// ${className ? `Class: ${className}` : 'Class definition'}`;
		}
		// Detect import/export statements
		else if (this.isImportExport(trimmedLine)) {
			comment = '// Module import/export';
		}
		// Detect if/else/for/while statements
		else if (this.isControlFlow(trimmedLine)) {
			comment = `// ${this.getControlFlowType(trimmedLine)} statement`;
		}
		// Default comment for other lines
		else {
			comment = '// TODO: Add description';
		}

		this.insertComment(model, position, comment, languageConfigurationService, editor);
	}

	private generateCommentForSelection(model: ITextModel, selection: Range, languageConfigurationService: ILanguageConfigurationService, editor: ICodeEditor): void {
		const selectedText = model.getValueInRange(selection);
		const lines = selectedText.split('\n');
		
		let comment = '';

		if (lines.length === 1) {
			const trimmedLine = lines[0].trim();
			if (this.isFunctionDeclaration(trimmedLine)) {
				const functionName = this.extractFunctionName(trimmedLine);
				comment = `// ${functionName ? `Function: ${functionName}` : 'Function definition'}`;
			} else {
				comment = '// Selected code block';
			}
		} else {
			// Multi-line selection
			const functionCount = lines.filter(line => this.isFunctionDeclaration(line.trim())).length;
			const variableCount = lines.filter(line => this.isVariableDeclaration(line.trim())).length;
			
			if (functionCount > 0) {
				comment = `// Code block with ${functionCount} function${functionCount > 1 ? 's' : ''}`;
			} else if (variableCount > 0) {
				comment = `// Code block with ${variableCount} variable${variableCount > 1 ? 's' : ''}`;
			} else {
				comment = `// Code block (${lines.length} lines)`;
			}
		}

		this.insertComment(model, selection.getStartPosition(), comment, languageConfigurationService, editor);
	}

	private insertComment(model: ITextModel, position: Position, comment: string, languageConfigurationService: ILanguageConfigurationService, editor: ICodeEditor): void {
		const lineContent = model.getLineContent(position.lineNumber);
		const indentation = lineContent.substring(0, lineContent.length - lineContent.trimStart().length);
		
		// Insert comment on line above current position
		const insertPosition = new Position(position.lineNumber, 1);
		const insertText = indentation + comment + '\n';
		
		editor.executeEdits('auto-comment', [{
			range: new Range(insertPosition.lineNumber, insertPosition.column, insertPosition.lineNumber, insertPosition.column),
			text: insertText
		}]);

		// Move cursor to end of inserted comment
		const newPosition = new Position(position.lineNumber, comment.length + indentation.length + 1);
		editor.setPosition(newPosition);
	}

	// Helper methods for code analysis
	private isFunctionDeclaration(line: string): boolean {
		return /^(function\s+\w+|const\s+\w+\s*=\s*\(|\w+\s*\(|async\s+function|\w+\s*:\s*function|export\s+function|function\s*\*)/i.test(line) ||
			   /^(public|private|protected)?\s*(static\s+)?[\w<>]+\s+\w+\s*\(/i.test(line) ||  // Java/C# method
			   /^def\s+\w+\s*\(/i.test(line);  // Python function
	}

	private extractFunctionName(line: string): string | null {
		// JavaScript/TypeScript function patterns
		let match = line.match(/function\s+(\w+)/i);
		if (match) return match[1];
		
		match = line.match(/const\s+(\w+)\s*=/i);
		if (match) return match[1];
		
		match = line.match(/(\w+)\s*\(/);
		if (match) return match[1];

		// Java/C# method patterns
		match = line.match(/[\w<>]+\s+(\w+)\s*\(/);
		if (match) return match[1];

		// Python function pattern
		match = line.match(/def\s+(\w+)\s*\(/i);
		if (match) return match[1];

		return null;
	}

	private isVariableDeclaration(line: string): boolean {
		return /^(var|let|const|int|string|boolean|double|float|char)\s+\w+/i.test(line) ||
			   /^(public|private|protected)?\s*(static\s+)?[\w<>]+\s+\w+\s*[=;]/i.test(line);
	}

	private extractVariableName(line: string): string | null {
		const match = line.match(/(?:var|let|const|int|string|boolean|double|float|char)\s+(\w+)/i) ||
					  line.match(/[\w<>]+\s+(\w+)\s*[=;]/);
		return match ? match[1] : null;
	}

	private isClassDeclaration(line: string): boolean {
		return /^(class|interface|struct|enum)\s+\w+/i.test(line) ||
			   /^(public|private|protected)?\s*(abstract\s+)?class\s+\w+/i.test(line);
	}

	private extractClassName(line: string): string | null {
		const match = line.match(/(?:class|interface|struct|enum)\s+(\w+)/i);
		return match ? match[1] : null;
	}

	private isImportExport(line: string): boolean {
		return /^(import|export|from|require)\s/i.test(line);
	}

	private isControlFlow(line: string): boolean {
		return /^(if|else|for|while|do|switch|case|try|catch|finally)\s*[\(\{]/i.test(line);
	}

	private getControlFlowType(line: string): string {
		if (/^if\s*\(/i.test(line)) return 'Conditional';
		if (/^for\s*\(/i.test(line)) return 'Loop';
		if (/^while\s*\(/i.test(line)) return 'Loop';
		if (/^switch\s*\(/i.test(line)) return 'Switch';
		if (/^try\s*\{/i.test(line)) return 'Error handling';
		return 'Control flow';
	}
}

registerEditorAction(AutoCommentAction);