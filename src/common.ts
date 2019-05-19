import { Node, VariableDeclaration, ObjectProperty, Identifier } from '@babel/types'
import { NodePath } from '@babel/traverse'

export const SYM_IDENTIFIER_USED = Symbol('IDENTIFIER_USED')
export const SYM_IDENTIFIER_TRACKED = Symbol('IDENTIFIER_TRACKED')

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
      console.log('node was NOT tracked')
      return
    }
    binding[SYM_IDENTIFIER_USED] = true
  }
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
