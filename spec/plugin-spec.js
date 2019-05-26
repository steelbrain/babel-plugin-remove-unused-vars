import { testWithOutput } from './helpers'
import test from 'ava'

const tests = [
  {
    code: `
      import test from 'x';
      import anotherTest from 'y';
      console.log(test());
    `,
    output: `
      import test from 'x';
      console.log(test());
    `,
  },
  {
    code: `
      import test from 'x';
      import anotherTest from 'y';
      console.log(anotherTest());
    `,
    output: `
      import anotherTest from 'y';
      console.log(anotherTest());
    `,
  },
  {
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
  },
  {
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
  },
  {
    code: `
      import * as test from 'x';
      import anotherTest from 'y';
      console.log(test());
    `,
    output: `
      import * as test from 'x';
      console.log(test());
    `,
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    code: `
      let y;
      let j;

      const x = z => j = y = z;

      x();
      y();
    `,
    output: `
      let y;

      const x = z => y = z;

      x();
      y();
    `,
  },
  {
    code: `
      let j;

      const k = ({
        l: m,
      }) => j = m.k;

      x();
      k();
    `,
    output: `
      let y;

      const x = z => y = z;

      x();
    `,
  },
  {
    code: `
      import { x, y, z } from 'a';
      import * as j from 'b';
    `,
    output: '',
  },
]

;[tests[8]].forEach(({ code, output }, index) => {
  test(`babel-plugin-remove-unused-vars-#${index + 1}`, async function(t) {
    await testWithOutput({
      test: t,
      code,
      output,
    })
  })
})
