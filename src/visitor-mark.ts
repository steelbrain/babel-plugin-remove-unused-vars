import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import {
  markNodeAsTracked,
  markNodeAsUsed,
  getSideInDeclaration,
  getSideInObjectProperty,
  getSideInImportSpecifier,
  getParentFunctionOrStatement,
  getSideInAssignmentExpression,
} from './common'

export default {
  Identifier(path: NodePath<babelTypes.Identifier>, { t }: { t: typeof babelTypes }) {
    const parentPath = path.parentPath

    if (t.isMemberExpression(parentPath)) {
      // Only process when left-most var in members
      if (path.node !== (parentPath.node as babelTypes.MemberExpression).object) {
        return
      }
    }

    const statementParent = getParentFunctionOrStatement(path)

    if (t.isImportDeclaration(statementParent)) {
      // Handle recursive destructuring here
      if (t.isImportDefaultSpecifier(parentPath)) {
        markNodeAsTracked(path.node)
      } else {
        const sideIms = getSideInImportSpecifier(path)
        if (sideIms === 'right') {
          markNodeAsTracked(path.node)
        }
      }

      return
    }

    if (t.isExpressionStatement(statementParent)) {
      const expressionPath = statementParent.get('expression') as NodePath<babelTypes.Node> | null
      if (t.isCallExpression(expressionPath)) {
        markNodeAsUsed(path)
      } else if (t.isAssignmentExpression(expressionPath)) {
        const sideAse = getSideInAssignmentExpression(path, expressionPath as NodePath<babelTypes.AssignmentExpression>)
        if (sideAse === 'right') {
          markNodeAsUsed(path)
        }
      }

      return
    }

    if (t.isVariableDeclaration(statementParent)) {
      const sideDecl = getSideInDeclaration(path, statementParent as NodePath<babelTypes.VariableDeclaration>)
      if (sideDecl === 'left') {
        if (t.isObjectProperty(parentPath)) {
          const objPropSide = getSideInObjectProperty(path, parentPath as NodePath<babelTypes.ObjectProperty>)
          if (objPropSide === 'right') {
            // is a decl
            markNodeAsTracked(path.node)
          }
        } else if (t.isVariableDeclarator(parentPath)) {
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

    if (t.isFunction(statementParent)) {
      // Identifier is a parameter or in function body

      if (t.isFunction(parentPath)) {
        // We have a simple param identifier
        markNodeAsTracked(path.node)
      } else if (t.isObjectProperty(parentPath)) {
        const objPropSide = getSideInObjectProperty(path, parentPath as NodePath<babelTypes.ObjectProperty>)
        if (objPropSide === 'right') {
          markNodeAsTracked(path.node)
        }
      } else if (t.isAssignmentExpression(parentPath)) {
        const sideAse = getSideInAssignmentExpression(path, parentPath as NodePath<babelTypes.AssignmentExpression>)
        if (sideAse === 'right') {
          markNodeAsUsed(path)
        }
      } else {
        markNodeAsUsed(path)
      }

      return
    }
  },
}
