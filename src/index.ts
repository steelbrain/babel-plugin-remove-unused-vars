import { NodePath } from '@babel/traverse'
import visitorMark from './visitor-mark'

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
          }
        },
      },
    },
  }
}
