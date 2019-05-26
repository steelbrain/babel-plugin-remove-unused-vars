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

### Caveats

This plugin is **NOT** perfect. It'll have false-positives and remove used variables or sometimes keep unused variables around. It's highly rare but still something you have to keep in mind, if you experience this behavior please open a bug report with steps to reproduce.

One case that has been intentionally not handled for code simplicity and maintainer sanity is deep assignment expressions, this plugin retains the right side statement if it's an assignment and is used and left side is unused, but if the assignment is somewhere deep inside, it'll treat it as a normal expression and not keep it around if left side is unused.

Explanation by example:

```
const a = b = something();
// ^ If a is unused, output:
b = something();
```
```
const a = something(b = jing());
// ^ If a is unused, output:
// - nothing.
```

It's a rare case, and a highly discouraged practice by most linters so support for it will not be added.

### License

This project is licensed under the terms of MIT License. See the LICENSE file for more info.
