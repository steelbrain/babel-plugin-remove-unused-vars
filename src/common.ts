import { Node, VariableDeclaration, ObjectProperty, Identifier, AssignmentExpression, ImportSpecifier } from '@babel/types'
import { NodePath } from '@babel/traverse'

export const SYM_IDENTIFIER_USED = Symbol('IDENTIFIER_USED')
export const SYM_IDENTIFIER_TRACKED = Symbol('IDENTIFIER_TRACKED')

export function getParentFunctionOrStatement(path: NodePath<Node>) {
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

export function markNodeAsTracked(node: Node) {
  node[SYM_IDENTIFIER_TRACKED] = true
  node[SYM_IDENTIFIER_USED] = false
}

export function isNodeTracked(node: Node) {
  return !!node[SYM_IDENTIFIER_TRACKED]
}

export function isNodeUsed(node: Node) {
  return !!node[SYM_IDENTIFIER_USED]
}

export function markNodeAsUsed(path: NodePath<Identifier>) {
  const binding = path.scope.getBindingIdentifier(path.node.name)
  if (binding) {
    if (!isNodeTracked(binding)) {
      return
    }
    binding[SYM_IDENTIFIER_USED] = true
  }
}

export function isNodeBindingUsed(path: NodePath<Identifier>) {
  const binding = path.scope.getBindingIdentifier(path.node.name)
  if (binding) {
    if (!isNodeTracked(binding)) {
      return true
    }
    return binding[SYM_IDENTIFIER_USED]
  }
  return true
}

export function getSideInDeclaration(child: NodePath<Node>, parent: NodePath<VariableDeclaration>): 'left' | 'right' | null {
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

export function getSideInObjectProperty(child: NodePath<Node>, parent: NodePath<ObjectProperty>): 'left' | 'right' | null {
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
  child: NodePath<Node>,
  parent: NodePath<AssignmentExpression>,
): 'left' | 'right' | null {
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

export function getSideInImportSpecifier(child: NodePath<Node>): 'left' | 'right' | null {
  let currentItem = child
  do {
    const parentPath = currentItem.parentPath as NodePath<ImportSpecifier>
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
