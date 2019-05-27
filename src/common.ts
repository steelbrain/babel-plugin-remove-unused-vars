import * as babelTypes from '@babel/types'
import { NodePath } from '@babel/traverse'

export const SYM_IDENTIFIER_USED = Symbol('IDENTIFIER_USED')
export const SYM_IDENTIFIER_TRACKED = Symbol('IDENTIFIER_TRACKED')

export function getParentFunctionOrStatement(path: NodePath<babelTypes.Node>) {
  do {
    if (!path.parentPath || (Array.isArray(path.container) && path.isStatement()) || path.isFunction()) {
      break
    } else {
      path = path.parentPath
    }
  } while (path)

  if (path && (path.isProgram() || path.isFile())) {
    return null
  }

  return path
}

export function markNodeAsTracked(node: babelTypes.Node) {
  node[SYM_IDENTIFIER_TRACKED] = true
  node[SYM_IDENTIFIER_USED] = false
}

export function isNodeTracked(node: babelTypes.Node) {
  return !!node[SYM_IDENTIFIER_TRACKED]
}

export function isNodeUsed(node: babelTypes.Node) {
  return !!node[SYM_IDENTIFIER_USED]
}

export function markNodeAsUsed(path: NodePath<babelTypes.Identifier>) {
  const binding = path.scope.getBindingIdentifier(path.node.name)
  if (binding) {
    if (!isNodeTracked(binding)) {
      return
    }
    binding[SYM_IDENTIFIER_USED] = true
  }
}

export function isNodeBindingUsed(path: NodePath<babelTypes.Identifier>) {
  const binding = path.scope.getBindingIdentifier(path.node.name)
  if (binding) {
    if (!isNodeTracked(binding)) {
      console.log('node is not tracked', binding)
      return true
    }
    return binding[SYM_IDENTIFIER_USED]
  }
  return true
}

export function getSideInDeclaration(
  child: NodePath<babelTypes.Node>,
  parent: NodePath<babelTypes.VariableDeclaration>,
): 'left' | 'right' | null {
  let currentItem = child
  const { declarations } = parent.node
  const length = declarations.length

  do {
    for (let i = 0; i < length; i++) {
      if (declarations[i].id === currentItem.node) {
        return 'left'
      }
      if (declarations[i].init === currentItem.node) {
        return 'right'
      }
    }
    currentItem = currentItem.parentPath
  } while (currentItem)

  return null
}

export function getSideInObjectProperty(
  child: NodePath<babelTypes.Node>,
  parent: NodePath<babelTypes.ObjectProperty>,
): 'left' | 'right' | null {
  if (!parent.node) {
    return null
  }

  let currentItem = child
  do {
    if (currentItem.node === parent.node.key) {
      return 'left'
    }
    if (currentItem.node === parent.node.value) {
      return 'right'
    }
    currentItem = currentItem.parentPath
  } while (currentItem)

  return null
}

export function getSideInAssignmentExpression(
  child: NodePath<babelTypes.Node>,
  parent: NodePath<babelTypes.AssignmentExpression>,
): 'left' | 'right' | null {
  if (!parent.node) {
    return null
  }

  let currentItem = child
  do {
    if (currentItem.node === parent.node.left) {
      return 'left'
    }
    if (currentItem.node === parent.node.right) {
      return 'right'
    }
    currentItem = currentItem.parentPath
  } while (currentItem)

  return null
}

export function getSideInImportSpecifier(child: NodePath<babelTypes.Node>): 'left' | 'right' | null {
  let currentItem = child
  do {
    const parentPath = currentItem.parentPath as NodePath<babelTypes.ImportSpecifier>
    if (parentPath.node) {
      if (currentItem.node === parentPath.node.imported) {
        return 'left'
      }

      if (currentItem.node === parentPath.node.local) {
        return 'right'
      }
    } else break
  } while (currentItem)

  return null
}

export function getSideInFunction(
  child: NodePath<babelTypes.Node>,
  parent: NodePath<babelTypes.Function>,
): 'body' | 'params' | null {
  if (!parent.node) {
    return null
  }

  let currentItem = child
  do {
    if (currentItem.node === (parent.node as babelTypes.FunctionDeclaration).id) {
      return null
    }
    if (parent.node.params.some(item => item === currentItem.node)) {
      return 'params'
    }
    if (currentItem.node === parent.node) {
      return 'body'
    }
    currentItem = currentItem.parentPath
  } while (currentItem)

  return null
}
