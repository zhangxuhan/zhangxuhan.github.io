const { spawn } = require('child_process');
const path = require('path');

const hexo = spawn('node', [
  path.join(__dirname, 'node_modules/hexo-cli/bin/hexo.js'),
  'server',
  '--port', '4000'
], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

hexo.on('error', err => { console.error('Failed to start:', err); process.exit(1); });