import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import { isNodeUsed, getStatementParent, getSideInDeclaration, getSideInObjectProperty } from './common'

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
      // Handle recursive destructuring here
      if (t.isImportDefaultSpecifier(parentPath)) {
        if (!isNodeUsed(path.node)) {
          statementParent.remove()
        }
        return
      }

      console.log('parentPath', parentPath.node)
    } else if (t.isExpressionStatement(statementParent)) {
      const expressionPath = statementParent.get('expression') as NodePath<babelTypes.Node> | null
      if (t.isCallExpression(expressionPath)) {
        // - mark as used
        return
      } else {
        console.log('unknown expression statement type', expressionPath.node.type)
      }
    } else if (t.isVariableDeclaration(statementParent)) {
      const sideDecl = getSideInDeclaration(path, statementParent as NodePath<babelTypes.VariableDeclaration>)
      if (sideDecl === 'left') {
        if (t.isObjectProperty(parentPath)) {
          const parentObjPropPath = parentPath as NodePath<babelTypes.ObjectProperty>
          const objPropSide = getSideInObjectProperty(path, parentObjPropPath)
          if (objPropSide === 'right') {
            if (!isNodeUsed(path.node)) {
              parentPath.remove()

              if (!(parentObjPropPath.parentPath.node as babelTypes.ObjectPattern).properties.length) {
                parentObjPropPath.parentPath.parentPath.remove()
              }
            }
          }
        }

        return
      }
      // Ignore right here, remove the entire statement if left is unused
    } else {
      console.log('unknown statement type', statementParent.node.type)
    }
  },
}