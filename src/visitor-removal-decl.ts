import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import {
  isNodeUsed,
  getStatementParent,
  getSideInDeclaration,
  getSideInObjectProperty,
  getSideInImportSpecifier,
} from './common'

export default {
  Identifier(path: NodePath<babelTypes.Identifier>, { t }: { t: typeof babelTypes }) {
    const parentPath = path.parentPath

    if (t.isMemberExpression(parentPath)) {
      return
    }

    const statementParent = getStatementParent(path)
    if (!statementParent) {
      return
    }

    if (t.isImportDeclaration(statementParent)) {
      if (t.isImportDefaultSpecifier(parentPath)) {
        if (!isNodeUsed(path.node)) {
          statementParent.remove()
        }
        return
      } else {
        const sideIms = getSideInImportSpecifier(path)
        if (sideIms === 'right') {
          if (!isNodeUsed(path.node)) {
            parentPath.remove()

            if (!(statementParent.node as babelTypes.ImportDeclaration).specifiers.length) {
              statementParent.remove()
            }
          }
        }
      }

      return
    }

    if (t.isExpressionStatement(statementParent)) {
      const expressionPath = statementParent.get('expression') as NodePath<babelTypes.Node> | null
      if (t.isCallExpression(expressionPath)) {
        // - mark as used
        return
      } else if (t.isAssignmentExpression(expressionPath)) {
        //
      } else {
        console.log('unknown expression statement type', expressionPath.node.type)
      }

      return
    }

    if (t.isVariableDeclaration(statementParent)) {
      const sideDecl = getSideInDeclaration(path, statementParent as NodePath<babelTypes.VariableDeclaration>)
      if (sideDecl === 'left') {
        if (t.isObjectProperty(parentPath)) {
          const parentObjPropPath = parentPath as NodePath<babelTypes.ObjectProperty>
          const objPropSide = getSideInObjectProperty(path, parentObjPropPath)
          if (objPropSide === 'right') {
            if (!isNodeUsed(path.node)) {
              parentPath.remove()

              let currentPath: NodePath<babelTypes.Node> = parentObjPropPath.parentPath
              for (;;) {
                const currentNode = currentPath.node as babelTypes.ObjectPattern
                if (currentNode.properties.length === 0) {
                  if (t.isObjectProperty(currentPath.parentPath)) {
                    const grandpaObject = currentPath.parentPath.parentPath.node as babelTypes.ObjectPattern
                    grandpaObject.properties = grandpaObject.properties.filter(item => item !== currentPath.parentPath.node)

                    currentPath = currentPath.parentPath.parentPath
                  } else {
                    if (t.isVariableDeclarator(currentPath.parentPath)) {
                      // No properties and parent path is root. remove the entire thing.
                      statementParent.remove()
                    }

                    break
                  }
                } else {
                  break
                }
              }
            }
          }
        } else if (t.isVariableDeclarator(parentPath)) {
          if (!isNodeUsed(path.node)) {
            statementParent.remove()
          }
        } else {
        }
      }
      // Ignore right side here, remove the entire statement if left is unused
      return
    }

    console.log('unknown statement type', statementParent.node.type)
  },
}
