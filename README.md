Babel Plugin Remove Unused Vars
-------------------------------

Babel plugin to remove unused variables and imports (Babel autofix for ESLint's no-unused-vars).

### Installation

```
npm install --save-dev babel-plugin-remove-unused-vars
```

### Usage

```
npx babel --no-babelrc --retain-lines --plugins babel-plugin-remove-unused-vars --out-dir src-2/ src/
```

This plugin is intended for source-to-source conversions. You can then replace original source
with output source, and have a quick look over at git diff to see what was changed and revert any
unwanted changes.

### Features

Removes

- Unused imports
- Unused function arguments
- Unused results of function calls (ie. requires, or any others.)
- Unused variables (even destructured ones)

### License

This project is licensed under the terms of MIT License. See the LICENSE file for more info.
