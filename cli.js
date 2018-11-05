#!/usr/bin/env node

/**
 * Command line `cli` for `jspub`.
 * <br/>__Command Line Options:__
 * - `-D` (or `--deploy`): Attempts to deploy the generated `jsdoc` to the configured deployment branch
 * @example
 * jspub ./jspub/jsdoc.conf
 * @example
 * jspub -D ./jspub/jsdoc.conf
 * @example
 * jspub --deploy ./jspub/jsdoc.conf
 * @module jspub
 */

const jspub = require('./index');

const argv = process.argv.slice(2);
var deploy, confPth;
for (let arg of argv) {
  if (arg.toUpperCase() === '-D' || arg.toUpperCase() === '--deploy') deploy = true;
  else if (!confPth) confPth = arg;
}
if (!confPth) throw new Error('A path to the jspub options JSON file must be present');
(async () => {
  try {
    await jspub(confPth, deploy);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();