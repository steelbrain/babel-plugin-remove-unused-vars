import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import {
  markNodeAsTracked,
  markNodeAsUsed,
  getSideInDeclaration,
  getSideInObjectProperty,
  getSideInImportSpecifier,
  getSideInAssignmentExpression,
} from './common'

export default {
  Identifier(path: NodePath<babelTypes.Identifier>, { t }: { t: typeof babelTypes }) {
    const parentPath = path.parentPath

    if (t.isMemberExpression(parentPath)) {
      return
    }

    const statementParent = path.getStatementParent()

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

    console.log('unknown statement type', statementParent.node.type)
  },
}
