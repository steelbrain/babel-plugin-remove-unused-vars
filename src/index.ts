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
      const specifiers = path.get('specifiers')

      specifiers.forEach(function(specifier) {
        specifier.traverse({ Identifier: markingIdentifierVisitor })
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
   * Removing visitors.
   */
  function removingIdentifierVisitor(path) {
    const { node } = path

    // TODO: Remove them.
  }
  function removingParamsVisitor(path) {
    const params = path.get('params')

    params.forEach(function(param) {
      if (t.isIdentifier(param.node)) {
        removingIdentifierVisitor(param)
      } else {
        param.traverse({ Identifier: removingIdentifierVisitor })
      }
    })
  }

  const removingVisitors = {
    VariableDeclarator(path) {
      const { node } = path

      if (t.isIdentifier(node.id)) {
        removingIdentifierVisitor(path.get('id'))
      } else {
        path.get('id').traverse({ Identifier: removingIdentifierVisitor })
      }
    },
    ImportDeclaration(path) {
      const specifiers = path.get('specifiers')

      specifiers.forEach(function(specifier) {
        specifier.traverse({ Identifier: removingIdentifierVisitor })
      })
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
      ...markingVisitors,
      Program: {
        exit(path) {
          // Mark the used ones
          path.traverse({
            Identifier(path) {
              const { node } = path
              if (path.isReferencedIdentifier()) {
                const binding = path.scope.getBinding(node.name)
                if (binding && binding.path.node[SYM_IDENTIFIER_TRACKED]) {
                  binding.path.node[SYM_IDENTIFIER_USED] = true
                }
              }
            },
          })
          // Remove the unused ones
          path.traverse(removingVisitors)
        },
      },
    },
  }
}
