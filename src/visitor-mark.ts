import { NodePath } from '@babel/traverse'
import * as babelTypes from '@babel/types'
import { markNodeAsTracked, markNodeAsUsed, getSideInDeclaration, getSideInObjectProperty } from './common'

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
        return
      }

      console.log('parentPath', parentPath.node)
    } else if (t.isExpressionStatement(statementParent)) {
      const expressionPath = statementParent.get('expression') as NodePath<babelTypes.Node> | null
      if (t.isCallExpression(expressionPath)) {
        markNodeAsUsed(path)
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
            // is a decl
            markNodeAsTracked(path.node)
          } else if (
            objPropSide === 'left' &&
            parentObjPropPath.node.key.name !== (parentObjPropPath.node.value as babelTypes.Identifier).name
          ) {
            console.log('diff from same')
          }
        }

        return
      }

      if (sideDecl === 'right') {
        markNodeAsUsed(path)

        return
      }
    } else {
      console.log('unknown statement type', statementParent.node.type)
    }
  },
}