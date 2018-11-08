#!/usr/bin/env node

/**
 * Command line `cli` for `jsdocp`.
 * <br/>__Command Line Options:__
 * - `-D` (or `--deploy`): Attempts to deploy the generated `jsdoc` to the configured deployment branch
 * @example
 * jsdocp ./jsdocp/jsdoc.conf
 * @example
 * jsdocp -D ./jsdocp/jsdoc.conf
 * @example
 * jsdocp --deploy ./jsdocp/jsdoc.conf
 * @module jsdocp
 */

const jsdocp = require('./index');

const argv = process.argv.slice(2);
var deploy, confPth;
for (let arg of argv) {
  if (arg.toUpperCase() === '-D' || arg.toUpperCase() === '--deploy') deploy = true;
  else if (!confPth) confPth = arg;
}
if (!confPth) throw new Error('A path to the jsdocp options JSON file must be present');
(async () => {
  try {
    await jsdocp(confPth, deploy);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();