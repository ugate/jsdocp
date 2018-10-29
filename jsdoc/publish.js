"use strict";

const markdown = require('jsdoc/util/markdown');
const logger = require('jsdoc/util/logger');

const { exec } = require('child_process');
const Fs = require('fs').promises;
const Path = require('path');

const pkg = require(Path.join(process.env.JSPUB_MODULE_PATH, 'package.json'));

/**
 * Publishes a modules documentation along with the following:
 * - A `versions.json` that contains an array of published `npm` versions in descending order
 * - A `CHANGELOG.html` containing change log details from the current version back to the previously published `npm` version
 * - Selection menu for available documentations by module versions
 * - Menu icon/link to the `npm` package
 * - Menu icon/link to the source code
 * - Menu icon/link to the change log
 * @param {TAFFY} taffyData See <http://taffydb.com/>
 * @param {Object} opts The JSDoc options
 * @param {Tutorial} tutorials The turtorials
 */
exports.publish = function(taffyData, opts, tutorials) {//console.dir(tutorials, {depth:100});
  // console.dir(opts, {depth:10});
  const thiz = this, args = arguments;
  return new Promise(async (resolve, reject) => {
    env.meta = { // accessibility in templates
      package: pkg,
      publish: {
        lastVersionPublished: process.env.JSPUB_PUBLISH_LAST_VER_PUB,
        lastVersion: process.env.JSPUB_PUBLISH_LAST_VER,
        moduleURL: process.env.JSPUB_PUBLISH_MODULE_URL,
        date: process.env.JSPUB_PUBLISH_DATE
      }
    };
    try {
      logger.debug(`mkdir on opts.destination = ${opts.destination}`);
      await Fs.mkdir(opts.destination, { recursive: true });
      const chglogPath = Path.join(opts.destination, 'CHANGELOG.html'), verPath = Path.join(opts.destination, 'versions.json');
      logger.debug(`Writting ${verPath}`);
      const wrVerProm = Fs.writeFile(verPath, process.env.JSPUB_PUBLISH_VERSIONS);
      const span = env.meta.publish.lastVersionPublished ? `v${env.meta.publish.lastVersionPublished}..HEAD ` : '';
      const line = opts.changelog && opts.changelog.line ? opts.changelog.line.replace(/"/g, '\\"') : '* %s';
      const header = opts.changelog && opts.changelog.header ? opts.changelog.header : `## ${env.meta.package.version}`;
      const gitlog = (grepo) => {
        const grep = grepo && grepo.regexp ? `--grep="${grepo.regexp.replace(/"/g, '\\"')}" ` : '';
        const rxi = grepo && grepo.ignoreCase ? '-i ' : '', rxe = grepo && grepo.extendedRegexp ? '-E ' : '';
        return new Promise((resolve, reject) => {
          exec(`git --no-pager log ${span}--oneline --no-merges ${rxi}${rxe}${grep}--pretty=format:"${line}" `, async (error, stdout, stderr) => {
            if (error) return reject(error);
            if (stderr) return reject(new Error(`Failed to generate CHANGELOG: ${stderr}`));
            resolve(stdout || '');
          });
        });
      };
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
        logger.debug(`Writting ${chglogPath}`);
        const wrClProm = Fs.writeFile(chglogPath, env.meta.changelog);
        await wrClProm;
      } catch(err) {
        err.message += ` (Unable to write ${chglogPath})`;
        return reject(err);
      }
      try {
        await wrVerProm;
      } catch (err) {
        err.message += ` (Unable to write ${verPath})`;
        return reject(err);
      }
      opts.template = opts.templateProxy; // use the actual template

      logger.debug(`Running markdown extensions on tutorials...`);
      await tutorialExts(tutorials);
      
      // transfer control over to template engine
      const Engine = require(`${Path.parse(opts.template).name}/publish`);
      resolve(Engine.publish.apply(thiz, args)); // no need to customize how docs are parsed, jut the layout.tmpl file
    } catch(err) {
      reject(err);
    }
  });
};

/**
 * Parses/sets the tutorial content that matches any of the markdown extensions
 * @private
 * @param {Object[]} tuts The tutorial object
 * @param {String} tuts[].content The content of the tutorial
 */
async function tutorialExts(tuts) {
  if (!tuts) return;
  if (tuts.content) tutorialExt(tuts);
  const prms = [];
  for (let tut of tuts.children) {
    prms.push(tutorialExt(tut));
  }
  await Promise.all(prms);
}

/**
 * Parses/sets the tutorial content that matches any of the markdown extensions
 * @private
 * @param {Object} tut The tutorial object
 * @param {String} tut.content The content of the tutorial
 */
async function tutorialExt(tut) {
  if (!tut.content) return;
  const rx = /```jspub\s*?([^\s]+)[\r\n]*([\s\S]*)```/ig, prms = [];
  tut.content.replace(rx, (mtch, pth) => {
    if (pth) prms.push(Fs.readFile(Path.resolve(process.env.JSPUB_MODULE_PATH, pth)));
    return mtch;
  });
  let vals = await Promise.all(prms), idx = -1;
  tut.content = tut.content.replace(rx, (mtch, pth, cnt) => {
    const lang = pth.split('.').pop();
    return `\`\`\`${lang}\n${vals[++idx].toString()}\n${cnt}\n\`\`\``;
  });
}