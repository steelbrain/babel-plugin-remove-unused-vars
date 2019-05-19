const coolTrim = require('cool-trim')
const { transformAsync } = require('@babel/core')

async function testWithOutput({ code, output }) {
  const transformed = await transformAsync(coolTrim(code), {
    babelrc: false,
    plugins: [require.resolve('..')],
    sourceMaps: false,
  })

  console.log('-'.repeat(10))
  console.log('expected:')
  console.log(coolTrim(output))
  console.log('-'.repeat(10))
  console.log('got:')
  console.log(transformed.code)
  console.log('-'.repeat(10))
}

// testWithOutput({
//   code: `
//     import test from 'x';
//     import anotherTest from 'y';
//     console.log(test());
//   `,
//   output: `
//     import test from 'x';
//     console.log(test());
//   `,
// })

// testWithOutput({
//   code: `
//     import test from 'x';
//     import anotherTest from 'y';
//     console.log(anotherTest());
//   `,
//   output: `
//     import anotherTest from 'y';
//     console.log(anotherTest());
//   `,
// })

// testWithOutput({
//   code: `
//     import test from 'x';
//     import anotherTest from 'y';
//     const {x,y,z} = test();
//     console.log(anotherTest());
//   `,
//   output: `
//     import anotherTest from 'y';
//     console.log(anotherTest());
//   `,
// })

// testWithOutput({
//   code: `
//     import test from 'x';
//     import anotherTest from 'y';
//     const {
//       x,
//       y,
//       z
//     } = test();
//     x();
//     console.log(anotherTest());
//   `,
//   output: `
//     import test from 'x';
//     import anotherTest from 'y';
//     const {
//       x
//     } = test();
//     x();
//     console.log(anotherTest());
//   `,
// })

// testWithOutput({
//   code: `
//     import * as test from 'x';
//     import anotherTest from 'y';
//     console.log(test());
//   `,
//   output: `
//     import * as test from 'x';
//     console.log(test());
//   `,
// })

// testWithOutput({
//   code: `
//     import * as test from 'x';
//     import { x, y, z } from 'y';
//     y();
//     console.log(test());
//   `,
//   output: `
//     import * as test from 'x';
//     import { y } from 'y';
//     y();
//     console.log(test());
//   `,
// })
// testWithOutput({
//   code: `
//     import * as test from 'x';
//     import { x, y, z } from 'y';
//     const {
//       j,
//       k: {
//         o,
//         l: { m },
//       },
//     } = y();
//     console.log(test());
//   `,
//   output: `
//     import * as test from 'x';
//     console.log(test());
//   `,
// })
// testWithOutput({
//   code: `
//     import * as test from 'x';
//     import { x, y, z } from 'y';
//     const {
//       j,
//       k: {
//         o,
//         l: { m },
//       },
//     } = y();
//     m();
//     console.log(test());
//   `,
//   output: `
//     import * as test from 'x';
//     import { y } from 'y';
//     const {
//       k: {
//         l: {
//           m
//         }
//       }
//     } = y();
//     m();
//     console.log(test());
//   `,
// })

// testWithOutput({
//   code: `
//     let y;

//     const x = z => y = z;

//     x();
//   `,
//   output: `
//     let y;

//     const x = z => y = z;

//     x();
//   `,
// })

testWithOutput({
  code: `
    let x = false
    if (true) {
      x = true
    }
  `,
  output: 'if (true) {}',
})
