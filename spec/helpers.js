import coolTrim from 'cool-trim'
import { transformAsync } from '@babel/core'

export async function testWithOutput({ test, code, output }) {
  const transformed = await transformAsync(coolTrim(code), {
    babelrc: false,
    plugins: [require.resolve('..')],
    sourceMaps: false,
  })

  console.log('output', transformed.code)
  test.is(coolTrim(output), transformed.code)
}
