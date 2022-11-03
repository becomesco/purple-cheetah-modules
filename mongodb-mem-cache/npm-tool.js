const { createConfig } = require('@banez/npm-tool');
const { useFS } = require('@becomes/purple-cheetah');

const fs = useFS({
  base: process.cwd(),
});

module.exports = createConfig({
  bundle: {
    extend: [
      {
        title: 'Remove tests from output',
        task: async () => {
          // await fs.copy(['dist', 'src'], 'dist');
          // await fs.deleteDir(['dist', 'src']);
          // await fs.deleteDir(['dist', 'test']);
          await fs.deleteFile(['dist', 'tsconfig.tsbuildinfo']);
        },
      },
    ],
  },
});
