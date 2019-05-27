import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import {
  isNodeBindingUsed,
  getSideInDeclaration,
  getSideInObjectProperty,
  getParentFunctionOrStatement,
  getSideInAssignmentExpression,
} from './common'

export default {
  Identifier(path: NodePath<babelTypes.Identifier>) {
    const parentPath = path.parentPath

    if (babelTypes.isMemberExpression(parentPath)) {
      return
    }

    const statementParent = getParentFunctionOrStatement(path)

    if (babelTypes.isImportDeclaration(statementParent)) {
      // Handle recursive destructuring here
      if (babelTypes.isImportDefaultSpecifier(parentPath)) {
        // - mark as tracked
      }

      return
    }

    if (babelTypes.isExpressionStatement(statementParent)) {
      const expressionPath = statementParent.get('expression') as NodePath<babelTypes.Node> | null
      if (babelTypes.isCallExpression(expressionPath)) {
        // - mark as used
      } else if (babelTypes.isAssignmentExpression(expressionPath)) {
        const sideAse = getSideInAssignmentExpression(path, expressionPath as NodePath<babelTypes.AssignmentExpression>)
        if (sideAse === 'left') {
          if (!isNodeBindingUsed(path)) {
            if (babelTypes.isAssignmentExpression((expressionPath.node as babelTypes.AssignmentExpression).right)) {
              expressionPath.replaceWith((expressionPath.node as babelTypes.AssignmentExpression).right)
            } else {
              expressionPath.remove()
            }
          }
        }
      }

      return
    }

    if (babelTypes.isVariableDeclaration(statementParent)) {
      const sideDecl = getSideInDeclaration(path, statementParent as NodePath<babelTypes.VariableDeclaration>)
      if (sideDecl === 'left') {
        if (babelTypes.isObjectProperty(parentPath)) {
          const parentObjPropPath = parentPath as NodePath<babelTypes.ObjectProperty>
          const objPropSide = getSideInObjectProperty(path, parentObjPropPath)
          if (objPropSide === 'right') {
            // is a decl
            // - mark as tracked
          }
        }
      }
      // Ignore right here, remove the entire statement if left is unused
      return
    }

    if (babelTypes.isFunction(statementParent)) {
      // Identifier is a parameter or in function body

      if (babelTypes.isFunction(parentPath)) {
        // We have a simple param identifier
        // - mark as tracked
      } else if (babelTypes.isObjectProperty(parentPath)) {
        const objPropSide = getSideInObjectProperty(path, parentPath as NodePath<babelTypes.ObjectProperty>)
        if (objPropSide === 'right') {
          // - mark as tracked
        }
      } else if (babelTypes.isAssignmentExpression(parentPath)) {
        const sideAse = getSideInAssignmentExpression(path, parentPath as NodePath<babelTypes.AssignmentExpression>)
        if (sideAse === 'right') {
          // - mark as tracked
        } else if (sideAse === 'left') {
          if (!isNodeBindingUsed(path)) {
            if (
              babelTypes.isAssignmentExpression(parentPath.parentPath) ||
              babelTypes.isAssignmentExpression((parentPath.node as babelTypes.AssignmentExpression).right)
            ) {
              parentPath.replaceWith((parentPath.node as babelTypes.AssignmentExpression).right)
            } else {
              parentPath.remove()
            }
          }
        }
      }

      return
    }
  },
}
