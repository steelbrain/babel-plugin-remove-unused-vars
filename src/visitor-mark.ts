import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import {
  markNodeAsTracked,
  markNodeAsUsed,
  getSideInFunction,
  getSideInDeclaration,
  getSideInImportSpecifier,
  getParentFunctionOrStatement,
  getSideInAssignmentExpression,
  isObjectPropertyDeclaration,
} from './common'

export default {
  JSXIdentifier(path: NodePath<babelTypes.JSXIdentifier>) {
    markNodeAsUsed(path)
  },
  Identifier(path: NodePath<babelTypes.Identifier>) {
    const parentPath = path.parentPath

    if (babelTypes.isMemberExpression(parentPath)) {
      // Only process when left-most var in members
      if (
        !(parentPath.node as babelTypes.MemberExpression).computed &&
        path.node !== (parentPath.node as babelTypes.MemberExpression).object
      ) {
        return
      }
    }

    const statementParent = getParentFunctionOrStatement(path)

    if (babelTypes.isImportDeclaration(statementParent)) {
      // Handle recursive destructuring here
      if (babelTypes.isImportDefaultSpecifier(parentPath)) {
        markNodeAsTracked(path.node)
      } else {
        const sideIms = getSideInImportSpecifier(path)
        if (sideIms === 'right') {
          markNodeAsTracked(path.node)
        }
      }

      return
    }

    if (babelTypes.isExpressionStatement(statementParent)) {
      const expressionPath = statementParent.get('expression') as NodePath<babelTypes.Node> | null
      if (babelTypes.isCallExpression(expressionPath)) {
        markNodeAsUsed(path)
      } else if (babelTypes.isAssignmentExpression(expressionPath)) {
        const sideAse = getSideInAssignmentExpression(path, expressionPath as NodePath<babelTypes.AssignmentExpression>)
        if (sideAse === 'right') {
          markNodeAsUsed(path)
        }
      } else {
        markNodeAsUsed(path)
      }

      return
    }

    if (babelTypes.isVariableDeclaration(statementParent)) {
      const sideDecl = getSideInDeclaration(path, statementParent as NodePath<babelTypes.VariableDeclaration>)
      if (sideDecl === 'left') {
        if (babelTypes.isObjectProperty(parentPath)) {
          if (isObjectPropertyDeclaration(path, parentPath as NodePath<babelTypes.ObjectProperty>)) {
            // is a decl
            markNodeAsTracked(path.node)
          }
        } else if (babelTypes.isVariableDeclarator(parentPath)) {
          markNodeAsTracked(path.node)
        } else {
          //
        }

        return
      }

      if (sideDecl === 'right') {
        markNodeAsUsed(path)

        return
      }

      return
    }

    if (babelTypes.isFunction(statementParent)) {
      // Identifier is a parameter or in function body

      const functionSide = getSideInFunction(path, statementParent as NodePath<babelTypes.Function>)

      if (functionSide === 'params') {
        if (babelTypes.isFunction(parentPath)) {
          markNodeAsTracked(path.node)
        } else if (babelTypes.isObjectProperty(parentPath)) {
          if (isObjectPropertyDeclaration(path, parentPath as NodePath<babelTypes.ObjectProperty>)) {
            markNodeAsTracked(path.node)
          }
        }
      } else if (functionSide === 'body') {
        if (babelTypes.isObjectProperty(parentPath)) {
          if (isObjectPropertyDeclaration(path, parentPath as NodePath<babelTypes.ObjectProperty>)) {
            markNodeAsUsed(path)
          }
        } else if (babelTypes.isAssignmentExpression(parentPath)) {
          const sideAse = getSideInAssignmentExpression(path, parentPath as NodePath<babelTypes.AssignmentExpression>)
          if (sideAse === 'right') {
            markNodeAsUsed(path)
          }
        } else {
          markNodeAsUsed(path)
        }
      }

      return
    }

    markNodeAsUsed(path)
  },
}
