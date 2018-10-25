"use strict";

const Engine = require("minami/publish");
const markdown = require('jsdoc/util/markdown');

const { exec } = require('child_process');
const Fs = require('fs').promises;
const Path = require('path');

const jspub = require('../index');
const pkg = require(Path.join(process.env.MODULE_PATH, 'package.json'));

/**
 * Publishes a modules documentation along with the following:
 * - A `versions.json` that contains an array of published `npm` versions in descending order
 * - A `CHANGELOG.html` containing change log details from the current version back to the previously published `npm` version
 * - Selection menu for available documentations by module versions
 * - Menu icon/link to the `npm` package
 * - Menu icon/link to the source code
 * - Menu icon/link to the change log
 * @param {TAFFY} taffyData See <http://taffydb.com/>
 * @param {Object} opts The options from {@link jspub}
 * @param {Tutorial} tutorials The turtorials
 */
exports.publish = function(taffyData, opts, tutorials) {
  // console.dir(opts, {depth:10});
  const thiz = this, args = arguments;
  return new Promise((resolve, reject) => {
    env.meta = { package: pkg }; // accessibility in templates
    exec(`npm view ${pkg.name} versions --json`, async (error, stdout, stderr) => {
      try {
        // need to account for first-time publish where module does not exist in npm
        const versions = (!error && !stderr && stdout) || '[]', latestVersion = JSON.parse(versions).pop() || '';
        env.meta.publish = {
          lastVersion: latestVersion || pkg.version,
          moduleURL: pkg.homepage.replace(/#[^\/]*/g, ''),
          date: formatedDate()
        };
        await Fs.mkdir(opts.destination, { recursive: true });
        const verPath = Path.join(opts.destination, 'versions.json'), chglogPath = Path.join(opts.destination, 'CHANGELOG.html');
        const verWriteProm = Fs.writeFile(verPath, versions);
        const span = latestVersion ? `v${latestVersion}..HEAD ` : '';
        const line = opts.changelog && opts.changelog.line ? pkgr(opts.changelog.line, env.meta).replace(/"/g, '\\"') : '* %s';
        const header = opts.changelog && opts.changelog.header ? pkgr(opts.changelog.header, env.meta) : `## ${pkg.version}`;
        const gitlog = (grepo) => {
          const grep = grepo && grepo.regexp ? `--grep="${pkgr(grepo.regexp, env.meta).replace(/"/g, '\\"')}" ` : '';
          const rxi = grepo && grepo.ignoreCase ? '-i ' : '', rxe = grepo && grepo.extendedRegexp ? '-E ' : '';
          return new Promise((resolve, reject) => {
            exec(`git --no-pager log ${span}--oneline --no-merges ${rxi}${rxe}${grep}--pretty=format:"${line}" `, async (error, stdout, stderr) => {
              if (error) return reject(error);
              if (stderr) return reject(new Error(`Failed to generate CHANGELOG: ${stderr}`));
              resolve(stdout || '');
            });
          });
        };
        try {
          await verWriteProm;
        } catch (err) {
          err.message += ` (Unable to write ${verPath})`;
          return reject(err);
        }
        var chglog = '', cltxt = '', clps = [], sctns = opts.changelog && opts.changelog.sections;
        if (sctns) {
          if (sctns.breaks && sctns.breaks.grep) clps.push({ promise: gitlog(sctns.breaks.grep), opts: sctns.breaks });
          if (sctns.features && sctns.features.grep) clps.push({ promise: gitlog(sctns.features.grep), opts: sctns.features });
          if (sctns.fixes && sctns.fixes.grep) clps.push({ promise: gitlog(sctns.fixes.grep), opts: sctns.fixes });
        } else chglog += await gitlog();
        for (let cl of clps) {
          try {
            cltxt = await cl.promise;
            if (cltxt) chglog += `\n\n${cl.opts.header}\n${cltxt}`;
          } catch (err) {
            err.message += ` (Unable to capture CHANGELOG section "${cl.opts.header}" for grep "${cl.opts.grep}")`;
            return reject(err);
          }
        }
        try {
          const parse = markdown.getParser();
          env.meta.changelog = parse(`${header}\n${chglog}`);
          await Fs.writeFile(chglogPath, env.meta.changelog);
        } catch(err) {
          err.message += ` (Unable to write ${chglogPath})`;
          return reject(err);
        }
        opts.template = opts.templateProxy; // use the actual template
        resolve(Engine.publish.apply(thiz, args)); // no need to customize how docs are parsed, jut the layout.tmpl file
      } catch(err) {
        reject(err);
      }
    });
  });
};

/**
 * Replaces each `${}` that contains `.` delimited paths to values within a supplied object
 * (e.g. `Testing ${someObject.someValue}` using object `{ someObject: { sameValue: 123 }}`
 * results in `Testing 123`
 * @private
 * @param {String} str The templated string to perform the replacements on
 * @param {Object} obj The object where values will be extracted from
 * @returns {String} The parsed template string
 */
function pkgr(str, obj) {
  return str.replace(/\$\{([^\}]*)\}/g, (mtch, path) => {
    var paths = path.split('.'), val = obj;
    if (!paths.length) return mtch;
    for (let i = 0, ln = paths.length; i < ln; i++) {
      if (i < ln - 1 && !val.hasOwnProperty(paths[i])) return mtch;
      val = val[paths[i]];
    }
    return val;
  });
}

/**
 * Generates a formatted date string
 * @private
 * @param {Date} [date=new Date()] The date to format
 * @param {String} [delimiter='-'] The date delimiter
 * @returns {String} The formmated date 
 */
function formatedDate(date, delimiter = '-') {
  date = date || new Date();
  return `${date.getFullYear()}${delimiter}${('0' + (date.getMonth() + 1)).slice(-2)}${delimiter}${('0' + date.getDate()).slice(-2)}`;
}