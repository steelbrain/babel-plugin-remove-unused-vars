import { NodePath } from '@babel/traverse'
import visitorMark from './visitor-mark'
import visitorRemoval from './visitor-removal'
import visitorRemovalDecl from './visitor-removal-decl'

const DEFAULT_ITERATIONS = 1

export default function({ types: t }, { iterations = null } = {}) {
  const iterationsToRun = parseInt(iterations, 10) || DEFAULT_ITERATIONS
  return {
    visitor: {
      Program: {
        exit(path: NodePath) {
          for (let i = 0; i < iterationsToRun; i++) {
            // Mark the relevant variables
            path.traverse(visitorMark, { t })
            path.traverse(visitorRemoval, { t })
            path.traverse(visitorRemovalDecl, { t })
          }
        },
      },
    },
  }
}
