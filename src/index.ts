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
    const localPath = path.get('local')

    if (t.isIdentifier(localPath)) {
      markingIdentifierVisitor(localPath)
    } else {
      localPath.traverse({ Identifier: markingIdentifierVisitor })
    }
  }

  const markingVisitors = {
    VariableDeclarator(path) {
      const idPath = path.get('id')

      if (t.isIdentifier(idPath)) {
        markingIdentifierVisitor(idPath)
      } else if (t.isObjectPattern(idPath)) {
        idPath.get('properties').map(function(propertyPath) {
          const propertyKeyPath = propertyPath.get('key')
          if (t.isIdentifier(propertyKeyPath)) {
            markingIdentifierVisitor(propertyKeyPath)
          } else {
            propertyKeyPath.traverse({ Identifier: markingIdentifierVisitor })
          }
        })
      } else {
        // Unknown stuff, better to not handle.
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
    if (node[SYM_IDENTIFIER_TRACKED] && !path.inType('VariableDeclarator')) {
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
    const localPath = path.get('local')

    if (t.isIdentifier(localPath)) {
      if (isIdentifierUnused(localPath)) {
        path.remove()
      }
    } else {
      // NOTE: This part is untested.
      localPath.traverse({
        Identifier(idPath) {
          if (isIdentifierUnused(idPath.get('local'))) {
            idPath.remove()
          }
        },
      })
    }
  }

  const removingVisitors = {
    VariableDeclarator(path) {
      // If variable assignment comes as part of function expression
      // remove the function call too.
      const idPath = path.get('id')
      if (t.isIdentifier(idPath)) {
        if (isIdentifierUnused(idPath)) {
          // Remove the declarator node entirely.
          path.parentPath.insertBefore(path.init)
          path.remove()
        }
      } else if (t.isObjectPattern(idPath)) {
        let usedIdentifiers = 0
        const unusedIdentifiers = []
        const properties = idPath.get('properties')
        properties.map(function(propertyPath) {
          const propertyKeyPath = propertyPath.get('key')
          if (t.isIdentifier(propertyKeyPath)) {
            if (isIdentifierUnused(propertyKeyPath)) {
              unusedIdentifiers.push(propertyKeyPath)
            } else {
              usedIdentifiers++
            }
          } else {
            propertyKeyPath.traverse({
              Identifier(propertyKeyPathId) {
                if (isIdentifierUnused(propertyKeyPathId)) {
                  unusedIdentifiers.push(propertyKeyPathId)
                } else {
                  usedIdentifiers++
                }
              },
            })
          }
        })
        if (!usedIdentifiers) {
          // Remove the declarator node entirely.
          path.parentPath.insertBefore(path.init)
          path.remove()
        } else {
          unusedIdentifiers.forEach(function(unusedIdentifier) {
            unusedIdentifier.remove()
          })
        }
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
