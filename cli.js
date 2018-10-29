#!/usr/bin/env node

const jspub = require('./index');

const argv = process.argv.slice(2);
if (!argv.length || !argv[0]) throw new Error('The 1st argument must be a path to the jspub options JSON file');
(async () => {
  try {
    await jspub(argv[0]);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();