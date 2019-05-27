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
      let y;
      let j;

      const x = z => j = y = z;

      x();
      j();
    `,
    output: `
      let j;

      const x = z => j = z;

      x();
      j();
    `,
  },
  {
    code: `
      let y;
      let j;

      const x = z => j = y = z;

      y();
    `,
    output: `
      let y;
      y();
    `,
  },
  {
    code: `
      let j;

      const k = ({
        l: m,
        o: p,
        q: { r: u }
      }) => j = m.k + u;

      k();
      j();
    `,
    output: `
      let j;

      const k = ({
        l: m,
        q: {
          r: u
        }
      }) => j = m.k + u;

      k();
      j();
    `,
  },
  {
    code: `
      let j = {};

      const k = ({
        l: m,
        o: p,
        q: { r: u }
      }) => j.x = m.k + u;

      k();
      j();
    `,
    output: `
      let j = {};

      const k = ({
        l: m,
        q: {
          r: u
        }
      }) => j.x = m.k + u;

      k();
      j();
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
      const k = () => {};

      x();
      k();
    `,
  },
  {
    code: `
      let j;

      const k = ({
        l: m,
      }, b) => {
        console.log('hi', b)
      };

      x();
      k();
    `,
    output: `
      const k = (_unusedParam, b) => {
        console.log('hi', b);
      };

      x();
      k();
    `,
  },
  {
    code: `
      import { x, y, z } from 'a';
      import * as j from 'b';
    `,
    output: '',
  },
  {
    code: `
      function x(j, k) {
        k();
      }

      x();
    `,
    output: `
      function x(j, k) {
        k();
      }

      x();
    `,
  },
  {
    code: `
      function x(j, k) {
        j();
      }

      x();
    `,
    output: `
      function x(j) {
        j();
      }

      x();
    `,
  },
  {
    code: `
      const x = b(j => j);
      x();
    `,
    output: `
      const x = b(j => j);
      x();
    `,
  },
  {
    code: `
      export default {
        x() {
          const a = f.g || {};
          const b = a.b;
          const c = a.c;
          const d = (e[b] || {})[c];
          return d;
        }

      };
    `,
    output: `
      export default {
        x() {
          const a = f.g || {};
          const b = a.b;
          const c = a.c;
          const d = (e[b] || {})[c];
          return d;
        }

      };
    `,
  },
  {
    code: `
      async function x() {
        const something = awesome();

        try {
          await something.another();
        } catch (error) {
          console.error(a)
        }
      }

      x();
    `,
    output: `
      async function x() {
        const something = awesome();

        try {
          await something.another();
        } catch (error) {
          console.error(a);
        }
      }

      x();
    `,
  },
  {
    code: `
      async function x({
        anotherThing = null
      }) {
        const something = awesome();

        try {
          await something.another(anotherThing);
        } catch (error) {
          console.error(a)
        }
      }

      x();
    `,
    output: `
      async function x({
        anotherThing = null
      }) {
        const something = awesome();

        try {
          await something.another(anotherThing);
        } catch (error) {
          console.error(a);
        }
      }

      x();
    `,
  },
]

tests.forEach(({ code, output }, index) => {
  test(`babel-plugin-remove-unused-vars-#${index + 1}`, async function(t) {
    await testWithOutput({
      test: t,
      code,
      output,
    })
  })
})
