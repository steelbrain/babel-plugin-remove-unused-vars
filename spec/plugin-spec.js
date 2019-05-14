import { testWithOutput } from './helpers'
import test from 'ava'

test('babel-plugin-remove-unused-vars', async function(t) {
  await testWithOutput({
    test: t,
    code: `
      import test from 'x';
      import anotherTest from 'y';
      console.log(test());
    `,
    output: `
      import test from 'x';
      console.log(test());
    `,
  })

  await testWithOutput({
    test: t,
    code: `
      import test from 'x';
      import anotherTest from 'y';
      console.log(anotherTest());
    `,
    output: `
      import anotherTest from 'y';
      console.log(anotherTest());
    `,
  })

  await testWithOutput({
    test: t,
    code: `
      import test from 'x';
      import anotherTest from 'y';
      const {x,y,z} = test();
      console.log(anotherTest());
    `,
    output: `
      import anotherTest from 'y';
      console.log(anotherTest());
    `,
  })

  await testWithOutput({
    test: t,
    code: `
      import test from 'x';
      import anotherTest from 'y';
      const {
        x,
        y,
        z
      } = test();
      x();
      console.log(anotherTest());
    `,
    output: `
      import test from 'x';
      import anotherTest from 'y';
      const {
        x
      } = test();
      x();
      console.log(anotherTest());
    `,
  })

  await testWithOutput({
    test: t,
    code: `
      import * as test from 'x';
      import anotherTest from 'y';
      console.log(test());
    `,
    output: `
      import * as test from 'x';
      console.log(test());
    `,
  })
  await testWithOutput({
    test: t,
    code: `
      import * as test from 'x';
      import { x, y, z } from 'y';
      y();
      console.log(test());
    `,
    output: `
      import * as test from 'x';
      import { y } from 'y';
      y();
      console.log(test());
    `,
  })
  await testWithOutput({
    test: t,
    code: `
      import * as test from 'x';
      import { x, y, z } from 'y';
      const {
        j,
        k: {
          o,
          l: { m },
        },
      } = y();
      console.log(test());
    `,
    output: `
      import * as test from 'x';
      console.log(test());
    `,
  })
  await testWithOutput({
    test: t,
    code: `
      import * as test from 'x';
      import { x, y, z } from 'y';
      const {
        j,
        k: {
          o,
          l: { m },
        },
      } = y();
      m();
      console.log(test());
    `,
    output: `
      import * as test from 'x';
      import { y } from 'y';
      const {
        k: {
          l: {
            m
          }
        }
      } = y();
      m();
      console.log(test());
    `,
  })

  await testWithOutput({
    test: t,
    code: `
      let y;

      const x = z => y = z;

      x();
    `,
    output: `
      let y;

      const x = z => y = z;

      x();
    `,
  })
})
