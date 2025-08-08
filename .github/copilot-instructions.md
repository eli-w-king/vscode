# VS Code Copilot Instructions

## Project Overview

Visual Studio Code is built with a layered architecture using TypeScript, web APIs and Electron, combining web technologies with native app capabilities. The codebase is organized into key architectural layers:

### Root Folders
- `src/`: Main TypeScript source code with unit tests in `src/vs/*/test/` folders
- `build/`: Build scripts and CI/CD tools
- `extensions/`: Built-in extensions that ship with VS Code
- `test/`: Integration tests and test infrastructure
- `scripts/`: Development and build scripts
- `resources/`: Static resources (icons, themes, etc.)
- `out/`: Compiled JavaScript output (generated during build)

### Core Architecture (`src/` folder)
- `src/vs/base/` - Foundation utilities and cross-platform abstractions
- `src/vs/platform/` - Platform services and dependency injection infrastructure
- `src/vs/editor/` - Text editor implementation with language services, syntax highlighting, and editing features
- `src/vs/workbench/` - Main application workbench for web and desktop
  - `workbench/browser/` - Core workbench UI components (parts, layout, actions)
  - `workbench/services/` - Service implementations
  - `workbench/contrib/` - Feature contributions (git, debug, search, terminal, etc.)
  - `workbench/api/` - Extension host and VS Code API implementation
- `src/vs/code/` - Electron main process specific implementation
- `src/vs/server/` - Server specific implementation

The core architecture follows these principles:
- **Layered architecture** - from `base`, `platform`, `editor`, to `workbench`
- **Dependency injection** - Services are injected through constructor parameters
- **Contribution model** - Features contribute to registries and extension points
- **Cross-platform compatibility** - Abstractions separate platform-specific code

### Built-in Extensions (`extensions/` folder)
The `extensions/` directory contains first-party extensions that ship with VS Code:
- **Language support** - `typescript-language-features/`, `html-language-features/`, `css-language-features/`, etc.
- **Core features** - `git/`, `debug-auto-launch/`, `emmet/`, `markdown-language-features/`
- **Themes** - `theme-*` folders for default color themes
- **Development tools** - `extension-editing/`, `vscode-api-tests/`

Each extension follows the standard VS Code extension structure with `package.json`, TypeScript sources, and contribution points to extend the workbench through the Extension API.

### Finding Related Code
1. **Semantic search first**: Use file search for general concepts
2. **Grep for exact strings**: Use grep for error messages or specific function names
3. **Follow imports**: Check what files import the problematic module
4. **Check test files**: Often reveal usage patterns and expected behavior

## Coding Guidelines

### Indentation

We use tabs, not spaces.

### Naming Conventions

- Use PascalCase for `type` names
- Use PascalCase for `enum` values
- Use camelCase for `function` and `method` names
- Use camelCase for `property` names and `local variables`
- Use whole words in names when possible

### Types

- Do not export `types` or `functions` unless you need to share it across multiple components
- Do not introduce new `types` or `values` to the global namespace

### Comments

- Use JSDoc style comments for `functions`, `interfaces`, `enums`, and `classes`

### Strings

- Use "double quotes" for strings shown to the user that need to be externalized (localized)
- Use 'single quotes' otherwise
- All strings visible to the user need to be externalized

### UI labels
- Use title-style capitalization for command labels, buttons and menu items (each word is capitalized).
- Don't capitalize prepositions of four or fewer letters unless it's the first or last word (e.g. "in", "with", "for").

### Style

#### TypeScript/JavaScript Style

- Use arrow functions `=>` over anonymous function expressions
- Only surround arrow function parameters when necessary. For example, `(x) => x + x` is wrong but the following are correct:

```typescript
x => x + x
(x, y) => x + y
<T>(x: T, y: T) => x === y
```

- Always surround loop and conditional bodies with curly braces
- Open curly braces always go on the same line as whatever necessitates them
- Parenthesized constructs should have no surrounding whitespace. A single space follows commas, colons, and semicolons in those constructs. For example:

```typescript
for (let i = 0, n = str.length; i < 10; i++) {
    if (x < 10) {
        foo();
    }
}
function f(x: number, y: string): void { }
```

- Whenever possible, use in top-level scopes `export function x(…) {…}` instead of `export const x = (…) => {…}`. One advantage of using the `function` keyword is that the stack-trace shows a good name when debugging.

#### CSS Style Guidelines

- Use tabs for indentation in CSS files (consistent with TypeScript)
- Follow kebab-case for CSS class names (e.g., `.monaco-text-button`, `.getting-started-container`)
- Use CSS custom properties (variables) for theme-aware styling: `var(--vscode-button-background)`
- Include Microsoft copyright header in all CSS files
- Group related CSS properties together and separate groups with blank lines
- Use meaningful class name prefixes:
  - `.monaco-` prefix for core Monaco editor components
  - `.vscode-` prefix for VS Code specific UI elements
  - Component-specific prefixes (e.g., `.getting-started-`, `.debug-`)

```css
/* Good example following VS Code patterns */
.monaco-text-button {
	box-sizing: border-box;
	display: flex;
	width: 100%;
	padding: 4px;
	border-radius: 2px;
	
	text-align: center;
	cursor: pointer;
	
	justify-content: center;
	align-items: center;
	
	border: 1px solid var(--vscode-button-border, transparent);
	color: var(--vscode-button-foreground);
	background-color: var(--vscode-button-background);
}

.monaco-text-button:hover {
	background-color: var(--vscode-button-hoverBackground);
}
```

- Use logical CSS properties for better internationalization support
- Always provide fallback values for CSS custom properties: `var(--vscode-foreground, #cccccc)`
- Use `!important` sparingly and only when overriding external libraries or addressing specificity conflicts
- Prefer flexbox and CSS Grid for layout over absolute positioning
- Include focus styles for accessibility: `outline-offset: 2px !important;`

#### HTML Structure Guidelines

- Use semantic HTML5 elements where appropriate (`<main>`, `<section>`, `<article>`, `<nav>`)
- Follow accessibility best practices:
  - Include appropriate ARIA attributes
  - Ensure proper heading hierarchy
  - Use meaningful alt text for images
- Use CSS classes instead of inline styles
- Keep HTML structure clean and avoid deep nesting when possible

#### File Naming Conventions

- Use kebab-case for CSS file names: `getting-started.css`, `quick-input.css`
- Place CSS files in a `media/` subdirectory within the component folder
- CSS files should be co-located with their TypeScript components
- Use descriptive names that match the component they're styling

#### Responsive Design Guidelines

- Use relative units (`em`, `rem`, `%`) for scalable layouts
- Design for various screen sizes and zoom levels (VS Code supports up to 500% zoom)
- Test layouts at different font sizes and screen resolutions
- Use CSS Grid and Flexbox for responsive layouts
- Consider high contrast mode compatibility

#### Theme Integration

- Always use CSS custom properties for colors: `var(--vscode-editor-background)`
- Support both light and dark themes through CSS variables
- Test styling in high contrast mode
- Avoid hardcoded color values - use theme variables instead
- Reference VS Code's color token system for consistent theming

### Code Quality

- All files must include Microsoft copyright header
- Prefer `async` and `await` over `Promise` and `then` calls
- All user facing messages must be localized using the applicable localization framework (for example `nls.localize()` method)
- Don't add tests to the wrong test suite (e.g., adding to end of file instead of inside relevant suite)
- Look for existing test patterns before creating new structures
- Use `describe` and `test` consistently with existing patterns
- If you create any temporary new files, scripts, or helper files for iteration, clean up these files by removing them at the end of the task
