import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import {
  isNodeUsed,
  getSideInDeclaration,
  getSideInObjectProperty,
  getSideInImportSpecifier,
  getParentFunctionOrStatement,
} from './common'

function removeObjectPropertyDecl({
  path,
  parentPath,
  statementParent,
}: {
  path: NodePath<babelTypes.Identifier>
  parentPath: NodePath<babelTypes.Node>
  statementParent: NodePath<babelTypes.Node>
}) {
  const parentObjPropPath = parentPath as NodePath<babelTypes.ObjectProperty>
  const objPropSide = getSideInObjectProperty(path, parentObjPropPath)
  if (objPropSide === 'right') {
    if (!isNodeUsed(path.node)) {
      parentPath.remove()

      let currentPath: NodePath<babelTypes.Node> = parentObjPropPath.parentPath
      for (;;) {
        const currentNode = currentPath.node as babelTypes.ObjectPattern
        if (currentNode.properties.length === 0) {
          if (currentPath.parentPath.isObjectProperty()) {
            const grandpaObject = currentPath.parentPath.parentPath.node as babelTypes.ObjectPattern
            grandpaObject.properties = grandpaObject.properties.filter(item => item !== currentPath.parentPath.node)

            currentPath = currentPath.parentPath.parentPath
          } else {
            if (currentPath.parentPath.isVariableDeclarator()) {
              // No properties and parent path is root. remove the entire thing.
              statementParent.remove()
            } else if (currentPath.parentPath.isFunction()) {
              // ObjectPattern is as a parameter in a function
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
}

export default {
  Identifier(path: NodePath<babelTypes.Identifier>, { t }: { t: typeof babelTypes }) {
    const parentPath = path.parentPath

    if (t.isMemberExpression(parentPath)) {
      return
    }

    const statementParent = getParentFunctionOrStatement(path)
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
      }

      return
    }

    if (t.isVariableDeclaration(statementParent)) {
      const sideDecl = getSideInDeclaration(path, statementParent as NodePath<babelTypes.VariableDeclaration>)
      if (sideDecl === 'left') {
        if (t.isObjectProperty(parentPath)) {
          removeObjectPropertyDecl({
            path,
            parentPath,
            statementParent,
          })
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

    if (t.isFunction(statementParent)) {
      // Identifier is a parameter or in function body

      if (t.isFunction(parentPath)) {
        // We have a simple param identifier
        // Only remove if last param
        const parentNode = parentPath.node as babelTypes.Function
        if (parentNode.params[parentNode.params.length - 1] === path.node && !isNodeUsed(path.node)) {
          path.remove()
        }
      }

      if (t.isObjectProperty(parentPath)) {
        const paramParent = parentPath.find(
          path =>
            // We found an object pattern and it's a direct discendent of this function aka the param.
            (path.isObjectPattern() && path.parentPath.node === statementParent.node) ||
            // We reached the end of the function decl
            path.node === statementParent.node,
        )
        if (paramParent && paramParent.isObjectPattern()) {
          removeObjectPropertyDecl({
            path,
            parentPath,
            statementParent: paramParent,
          })
        }
      }
      return
    }
  },
}
