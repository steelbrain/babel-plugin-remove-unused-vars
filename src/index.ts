import { SYM_IDENTIFIER_TRACKED, SYM_IDENTIFIER_USED } from './constants'

export default function({ types: t }) {
  /**
   * Marking visitors
   */
  function markingIdentifierVisitor(path) {
    const { node } = path

    node[SYM_IDENTIFIER_USED] = false
    node[SYM_IDENTIFIER_TRACKED] = true
  }
  function markingParamsVisitor(path) {
    const params = path.get('params')

    params.forEach(function(param) {
      if (t.isIdentifier(param.node)) {
        markingIdentifierVisitor(param)
      } else {
        param.traverse({ Identifier: markingIdentifierVisitor })
      }
    })
  }
  function markingImportVisitor(path) {
    const { node } = path

    if (t.isIdentifier(node.local)) {
      markingIdentifierVisitor(path.get('local'))
    } else {
      path.get('local').traverse({ Identifier: markingIdentifierVisitor })
    }
  }

  const markingVisitors = {
    VariableDeclarator(path) {
      const { node } = path

      if (t.isIdentifier(node.id)) {
        markingIdentifierVisitor(path.get('id'))
      } else {
        path.get('id').traverse({ Identifier: markingIdentifierVisitor })
      }
    },
    ImportDeclaration(path) {
      path.traverse({
        ImportSpecifier: markingImportVisitor,
        ImportDefaultSpecifier: markingImportVisitor,
        ImportNamespaceSpecifier: markingImportVisitor,
      })
    },
    ...['ObjectMethod', 'ArrowFunctionExpression', 'ClassMethod', 'FunctionDeclaration', 'FunctionExpression'].reduce(
      (agg, curr) => ({
        ...agg,
        [curr]: markingParamsVisitor,
      }),
      {},
    ),
  }

  /**
   * Flagging visitors
   */

  function flagIdentifierAsUsed(path) {
    const { node } = path
    if (node[SYM_IDENTIFIER_TRACKED]) {
      node[SYM_IDENTIFIER_USED] = true
    }
  }

  const flaggingVisitors = {
    Identifier(path) {
      const { node } = path
      if (path.isReferencedIdentifier()) {
        const binding = path.scope.getBinding(node.name)
        if (binding) {
          const { path } = binding
          if (t.isIdentifier(path.node)) {
            flagIdentifierAsUsed(path)
          } else {
            path.traverse({ Identifier: flagIdentifierAsUsed })
          }
        }
      }
    },
  }

  /**
   * Removing visitors.
   */
  function isIdentifierUnused(path) {
    return path.node[SYM_IDENTIFIER_TRACKED] && !path.node[SYM_IDENTIFIER_USED]
  }
  function removingParamsVisitor(path) {
    const params = path.get('params')

    params.forEach(function(param) {
      if (t.isIdentifier(param.node)) {
        // removingIdentifierVisitor(param)
      } else {
        // param.traverse({ Identifier: removingIdentifierVisitor })
      }
    })
  }
  function removingImportVisitor(path) {
    const { node } = path

    if (t.isIdentifier(node.local)) {
      if (isIdentifierUnused(path.get('local'))) {
        path.remove()
      }
    }
  }

  const removingVisitors = {
    VariableDeclarator(path) {
      // If variable assignment comes as part of function expression
      // and function is require, remove the function call too.

      const { node } = path

      if (t.isIdentifier(node.id)) {
        const idPath = path.get('id')
        if (isIdentifierUnused(idPath)) {
          // Remove the declarator node entirely.
          path.parentPath.insertBefore(path.init)
          path.remove()
        }
      } else {
        // TODO
        // Variable destructuring assignments
      }
    },
    ImportDeclaration(path) {
      const specifiers = path.get('specifiers')
      path.traverse({
        ImportSpecifier: removingImportVisitor,
        ImportDefaultSpecifier: removingImportVisitor,
        ImportNamespaceSpecifier: removingImportVisitor,
      })
      if (specifiers.length && !path.node.specifiers.length) {
        path.remove()
      }
    },
    ...['ObjectMethod', 'ArrowFunctionExpression', 'ClassMethod', 'FunctionDeclaration', 'FunctionExpression'].reduce(
      (agg, curr) => ({
        ...agg,
        [curr]: removingParamsVisitor,
      }),
      {},
    ),
  }

  return {
    visitor: {
      Program: {
        exit(path) {
          const iterations = 5
          for (let i = 0; i < iterations; i++) {
            // Mark the relevant variables
            path.traverse(markingVisitors)
            // Mark the used ones
            path.traverse(flaggingVisitors)
            // Remove the unused ones
            path.traverse(removingVisitors)
          }
        },
      },
    },
  }
}
