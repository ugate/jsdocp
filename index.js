"use strict";

const { exec } = require('child_process');
const Path = require('path');
const Fs = require('fs');
const Os = require('os');
const tmpdir = Os.tmpdir();

// TODO : ESM remove the following lines...
module.exports = generateDocs;

/**
 * Generates the JSDoc style results along with previously published `npm` jsdoc by version. How doc versions are displayed in the
 * end result are customizable via the described _options_. A customizable changelog is also generated that contains filtered commit
 * messages since the last tagging of the `git` repository where the package resides.
 * ### Immutable Configuration Options:
 * The configuration options documented here only contain add-on options for JSDoc. See the JSDoc documentation for the full list of
 * configuration options. There are however a few configuration options that cannot be overridden. They include:
 * - `conf.templates.default.layoutFile`: Set to the internal layout file used during execution.
 * 
 * ### Template Requirements:
 * `conf.opts.template` should reference a path to the actual JSDoc template being used (e.g. `./node_modules/minami` would be valid
 * assuming that the `minami` template module is installed).
 * ### Template Literals:
 * All of the add-on configuration values can also contain template literals (i.e. `${}`) that reference paths within the following objects:
 * - `${package}`: The `package.json` object followed by any of it's properties (e.g. `${package.repository.url}/README.md`).
 * - `${publish.lastVersion}`: Will evaluate to the last version published to `npm` (or blank when nothing has been published yet).
 * - `${publish.moduleURL}`: Will basically evaluate to the `homepage` in `package.json`, but will also remove any _hashes_ in the URL (e.g.
 * assuming a `homepage` of `https://example.com/username/module#readme` would become `https://example.com/username/module`).
 * - `${publish.date}`: The current date string formatted as `YYYY-MM-DD`
 * - `${publish.tmpdir}`: The temporary directory where disposable files are stored during execution
 * 
 * #### See documentation for default values that are ported over from `./publish/defaults.conf`
 * @param {(String|Object)} conf Either the path to the JSDoc configuration file or the actual JSDoc configuration itself.
 * @param {Object} [conf.versions] The versions options used to generate links to previously published version docs
 * @param {String} [conf.versions.from] A Semantic Versioning compliant version that designates the first version to show
 * in the version drop-down selection for different docs (omit to list all of them)
 * @param {String} [conf.versions.include] A designation that inidcates what doc versions to show in the drop-down selection.
 * A designation of `major` will only show versions that have been released for __major___ version tags (i.e. the _first_
 * number in the version). A designation of `minor` will only show versions that have been released for __minor__ version
 * tags (i.e. the _second_ number in the version). `undefined` will cause the default value to be used. Any other value, or blank value will cause
 * all versions to be included.
 * @param {Object} [conf.changelog] The change log options used to generate the change log file and link
 * @param {String} [conf.changelog.line] The _format_ for individual commit lines produced in the change log markdown.
 * @param {String} [conf.changelog.header] The markdown that will be pre-pended to the change log.
 * @param {Object} [conf.changelog.sections] The sections within the change log which organize changes (omit output a list without sections)
 * @param {String} [conf.changelog.sections.breaks] Section options for breaking changes
 * @param {String} [conf.changelog.sections.breaks.header] Markdown used as a _header_ when there are change log entries for breaking changes
 * @param {String} [conf.changelog.sections.breaks.grep] Section `grep` options for breaking changes
 * @param {String} [conf.changelog.sections.breaks.grep.regexp] The regular expression used as filter in the `git log -grep=` for breaking changes
 * @param {String} [conf.changelog.sections.breaks.grep.ignoreCase] `true` for case-insensitive `git log -i` for breaking changes
 * @param {String} [conf.changelog.sections.breaks.grep.extendedRegexp] `true` for _extended_ regular expressions `git log -E` for breaking changes
 * @param {String} [conf.changelog.sections.breaks.grep.allMatch] `true` to limit all regular expressions in the `grep` for breaking changes
 * @param {String} [conf.changelog.sections.features] Section options for features
 * @param {String} [conf.changelog.sections.features.header] Markdown used as a _header_ when there are change log entries for features
 * @param {String} [conf.changelog.sections.features.grep] Section `grep` options for features
 * @param {String} [conf.changelog.sections.features.grep.regexp] The regular expression used used as filter in the `git log -grep=` for features
 * @param {String} [conf.changelog.sections.features.grep.ignoreCase] `true` for case-insensitive `git log -i` for features
 * @param {String} [conf.changelog.sections.features.grep.extendedRegexp] `true` for _extended_ regular expressions `git log -E` for features
 * @param {String} [conf.changelog.sections.features.grep.allMatch] `true` to limit all regular expressions in the `grep` for features
 * @param {String} [conf.changelog.sections.fixes] Section options for features
 * @param {String} [conf.changelog.sections.fixes.header] Markdown used as a _header_ when there are change log entries for fixes
 * @param {String} [conf.changelog.sections.fixes.grep] Section `grep` options for fixes
 * @param {String} [conf.changelog.sections.fixes.grep.regexp] The regular expression used used as filter in the `git log -grep=` for fixes
 * @param {String} [conf.changelog.sections.fixes.grep.ignoreCase] `true` for case-insensitive `git log -i` for fixes
 * @param {String} [conf.changelog.sections.fixes.grep.extendedRegexp] `true` for _extended_ regular expressions `git log -E` for fixes
 * @param {String} [conf.changelog.sections.fixes.grep.allMatch] `true` to limit all regular expressions in the `grep` for fixes
 */
function generateDocs(conf) {
// TODO : ESM use... export function generateDocs(conf) {

  const modulePath = Path.normalize(process.env.INIT_CWD || process.env.PWD); // npm run dir or proccess dir
  const mwd = Path.parse(modulePath);
  const jspubPath = mwd.name === 'jspub' ? modulePath : Path.resolve(modulePath, 'node_modules/jspub');
  const jspubConfPath = Path.resolve(jspubPath, 'jsdoc/defaults.json');
  const jsdocPath = Path.resolve(modulePath, 'node_modules/jsdoc');
  const jsdocCliPath = Path.resolve(modulePath, 'node_modules/.bin/jsdoc');

  var moduleConf, jspubTmpdir = Fs.mkdtempSync(`${tmpdir}${Path.sep}`), tempConfPath = Path.resolve(jspubTmpdir, 'jsdoc.json');
  // publishing runs in a separate process and requires a path
  if (typeof conf === 'object') {
    moduleConf = conf;
  } else {
    const confPath = Path.resolve(modulePath, conf);
    moduleConf = JSON.parse(Fs.readFileSync(confPath).toString());
  }
  writeConf(moduleConf, modulePath, jspubPath, jspubConfPath, tempConfPath);
  
  const execOpts = {
    env: {
      MODULE_PATH: modulePath,
      CONF_PATH: tempConfPath,
      JSPUB_PATH: jspubPath,
      JSDOC_PATH: jsdocPath,
      JSDOC_TMPDIR: jspubTmpdir,
      Path: process.env.Path || process.env.PATH
    },
    cwd: modulePath,
    timeout: 30000
  };
  const jsdoc = exec(`${jsdocCliPath} -c "${tempConfPath}" --verbose`, execOpts);
  jsdoc.stdout.pipe(process.stdout);
  jsdoc.stderr.pipe(process.stderr);
  jsdoc.on('error', error => console.error(error));
  jsdoc.on('exit', (code, signal) => console.log(`jsdoc exited with code: ${code.toString()}${signal ? ` signal: ${signal}` : ''}`));
}

/**
 * Sanitizes JSDoc configuration options in order for publishing to take place
 * @private
 * @param {Object} conf The JSDoc configuration
 * @param {String} modulePath The path to the module that the configuration is for
 * @param {String} jspubPath The path to the `jspub` module
 * @param {String} jspubConfPath The path to the `jspub` JSON file that contains the default configuration options
 * @param {String} tempConfPath The path where the sanitized JSDoc configuration options will be written
 */
function writeConf(conf, modulePath, jspubPath, jspubConfPath, tempConfPath) {
  if (!conf.opts || !conf.opts.template) {
    const error = new Error('JSDoc configuration options must contain an "opts.template" property set to a path '
    + 'to a JSDoc template that will be used');
    error.conf = conf;
    throw error;
  }
  var pkgPath, pkg;
  if (conf.opts.travis) {
    pkgPath = Path.resolve(modulePath, 'package.json');
    pkg = Fs.readFileSync(pkgPath);
    if (!pkg.scripts || !pkg.scripts.jspub) {
      throw new Error(`"package.json" must include a "scripts.jspub" when using travis-ci `
      + `(e.g. jspub ./publish/conf.json), but none was found at "${pkgPath}"`);
    }
  }

  const jpConf = JSON.parse(Fs.readFileSync(jspubConfPath).toString());

  // template needs to be set to the internal template so it can be proxied
  conf.opts.templateProxy = conf.opts.template;
  conf.opts.template = Path.resolve(jspubPath, jpConf.opts.template);

  // requires at least the markdown plugin
  conf.plugins = conf.plugins || [];
  if (!conf.plugins.includes('plugins/markdown')) conf.plugins.push('plugins/markdown');

  // ensure layoutFile is set to the one used by jspub
  conf.templates = conf.templates || {};
  conf.templates.default = conf.templates.default || {};
  conf.templates.default.layoutFile = Path.resolve(jspubPath, jpConf.templates.default.layoutFile);
  // ensure include contains the include from jspub
  conf.templates.default.staticFiles = conf.templates.default.staticFiles || {};
  const incls = conf.templates.default.staticFiles.include;
  const jpIncls = jpConf.templates.default.staticFiles.include;
  for (let i = 0; i < jpIncls.length; i++) jpIncls[i] = Path.resolve(jspubPath, jpIncls[i]);
  conf.templates.default.staticFiles.include = Array.isArray(incls) ? jpIncls.concat(incls) : jpIncls;

  // ensure the default opts are set when missing
  conf.opts = merge(jpConf.opts, conf.opts);

  // ensure the jspub script defined in the module package is set in the opts
  if (pkg && pkg.scripts && pkg.scripts.jspub) conf.opts.travis.pages.script.jspub = pkg.scripts.jspub;
  else delete conf.opts.travis;

  Fs.writeFileSync(tempConfPath, JSON.stringify(conf));
}

/**
 * Performs a __deep__ merge on one or more sources. The result is similar to `Object.assign` or `{ ...src1, ... src2 }`,
 * but retains the accumulated property values expected during a _deep_ merge.
 * @private
 * @param  {...any} srcs The sources that will be merged
 * @returns {*} the merged entity
 */
function merge(...srcs) {
  let rtn = {};
  for (const src of srcs) {
    if (src instanceof Array) {
      if (!(rtn instanceof Array)) rtn = [];
      rtn = [...rtn, ...src];
    } else if (src instanceof Object) {
      for (let [key, value] of Object.entries(src)) {
        if (value instanceof Object && key in rtn) value = merge(rtn[key], value);
        rtn = { ...rtn, [key]: value };
      }
    }
  }
  return rtn;
}