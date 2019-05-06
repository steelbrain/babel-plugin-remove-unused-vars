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
      if (t.isIdentifier(param)) {
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
  function markingObjectPatternVisitor(path) {
    path.get('properties').map(function(propertyPath) {
      const propertyValuePath = propertyPath.get('value')
      if (t.isIdentifier(propertyValuePath)) {
        markingIdentifierVisitor(propertyValuePath)
      } else if (t.isObjectPattern(propertyValuePath)) {
        markingObjectPatternVisitor(propertyValuePath)
      } else {
        propertyValuePath.traverse({ Identifier: markingIdentifierVisitor })
      }
    })
  }

  const markingVisitors = {
    VariableDeclarator(path) {
      const idPath = path.get('id')

      if (t.isIdentifier(idPath)) {
        markingIdentifierVisitor(idPath)
      } else if (t.isObjectPattern(idPath)) {
        markingObjectPatternVisitor(idPath)
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
    if (node[SYM_IDENTIFIER_TRACKED]) {
      node[SYM_IDENTIFIER_USED] = true
    }
  }

  const flaggingVisitors = {
    Identifier(path) {
      const { node } = path
      if (path.isReferencedIdentifier() && !path.inType('VariableDeclarator')) {
        const binding = path.scope.getBinding(node.name)
        if (binding) {
          const { path: bindingPath } = binding

          if (t.isIdentifier(bindingPath)) {
            flagIdentifierAsUsed(bindingPath)
          } else {
            bindingPath.traverse({
              Identifier(idPath) {
                if (idPath.node.name === node.name) {
                  flagIdentifierAsUsed(idPath)
                }
              },
            })
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

    let i = params.length
    while (i--) {
      const param = params[i]
      let unused = false
      if (t.isIdentifier(param)) {
        if (isIdentifierUnused(param)) {
          unused = true
        }
      } else {
        param.traverse({
          Identifier(idPath) {
            if (isIdentifierUnused(idPath)) {
              unused = true
            }
          },
        })
      }
      if (!unused) {
        break
      }
    }

    path.node.params = path.node.params.slice(0, i + 1)
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
  function removingObjectPatternCollector(path, usedIdentifiers, unusedIdentifiers) {
    const properties = path.get('properties')
    properties.map(function(propertyPath) {
      const propertyValuePath = propertyPath.get('value')
      if (t.isIdentifier(propertyValuePath)) {
        if (isIdentifierUnused(propertyValuePath)) {
          unusedIdentifiers.push(propertyValuePath)
        } else {
          usedIdentifiers.push(propertyValuePath)
        }
      } else if (t.isObjectPattern(propertyValuePath)) {
        removingObjectPatternCollector(propertyValuePath, usedIdentifiers, unusedIdentifiers)
      } else {
        propertyValuePath.traverse({
          Identifier(propertyValuePathId) {
            if (isIdentifierUnused(propertyValuePathId)) {
              unusedIdentifiers.push(propertyValuePathId)
            } else {
              usedIdentifiers.push(propertyValuePath)
            }
          },
        })
      }
    })
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
        const usedIdentifiers = []
        const unusedIdentifiers = []

        removingObjectPatternCollector(idPath, usedIdentifiers, unusedIdentifiers)

        if (!usedIdentifiers.length) {
          // Remove the declarator node entirely.
          path.parentPath.insertBefore(path.init)
          path.remove()
        } else {
          unusedIdentifiers.forEach(function(unusedIdentifier) {
            if (t.isObjectProperty(unusedIdentifier.parentPath)) {
              unusedIdentifier.parentPath.remove()
            } else {
              unusedIdentifier.remove()
            }
          })
          idPath.traverse({
            ObjectPattern(objectPatternPath) {
              if (!objectPatternPath.node.properties.length) {
                objectPatternPath.parentPath.remove()
              }
            },
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
