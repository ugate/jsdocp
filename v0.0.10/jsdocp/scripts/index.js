var jsdocp = new JSDocp();

function JSDocp() {
  var jp = this, py = window.pageYOffset, mobile = window.matchMedia('(max-width: 680px)');
  var chglogId = 'jsdocpChangelog', chglogContentId = 'jsdocpChangelogContent';
  var logoSrcSel = '.jsdocp-logo-svg', logoSrcAttr = 'jsdocp-logo-src';

  // handles mobile nav menu showing/hiding based upon scrolling direction
  window.addEventListener('scroll', function scroller() {
    var y = window.pageYOffset;
    if (mobile.matches) {
      var nav = document.getElementById('jsdocpNav');
      if (nav) nav.style.bottom = py > y ? '0' : '-' + getComputedStyle(nav).height;
    }
    py = y;
  });

  // handle loading of versions.json and populates the version drop-down select
  window.addEventListener('load', function loaded() {
    changelogLink();
    jp.loadVersions();
    jp.imgSvgToInline(document.querySelectorAll(logoSrcSel), logoSrcAttr);
  });

  /**
   * Attempt to override the link to the CHANGELOG in order to keep it within the same page wrapper
   */
  function changelogLink() {
    var cla = document.getElementById(chglogId), cl = document.getElementById(chglogContentId);
    var clt = document.getElementById('main');
    if (!clt) clt = querySelectorOne(['.main', '.content']);
    if (clt && cla && cl) {
      var originalContent = clt.innerHTML, originalTitle = document.title;
      var loadChglog = function loadChglog() {
        var page = location.pathname.replace(/^.*[\\/]/, ''), clPage = cla.getAttribute('href').replace(/^.*[\\/]/, '');
        var usingCl = page !== clPage;
        var title = usingCl ? (cl.hasAttribute('data-title') && cl.dataset.title) || clPage : originalTitle;
        clt.innerHTML = usingCl ? cl.innerHTML : originalContent;
        document.title = title;
        return { title: title, changelog: usingCl, page: clPage };
      };
      cla.addEventListener('click', function overrideChglogClick(event) {
        try {
          var state = loadChglog();
          if (state.changelog) history.pushState(state, state.title, state.page);
        } catch (err) {
          console.error(err);
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
      }, { capture: true });
      window.addEventListener('popstate', loadChglog);
    }
  }

  /**
   * Finds the first occurance of a selector that has only one element in the document
   * @param {String[]} sels The CSS selectors
   */
  function querySelectorOne(sels) {
    for (var i = 0, el; i < sels.length; i++) {
      el = document.querySelectorAll(sels[i]);
      if (clt.length == 1) return el;
    }
  }
}

/**
 * Loads the `versions.json` into the `#jsdocpVersions` select element from it's `data-jsdocp-json-url` attribute URL. Uses the `data-jsdocp-from`,
 * `data-jsdocp-type` to filter what versions are shown.
 */
JSDocp.prototype.loadVersions = function loadVersions() {
  var jp = this, sel = document.querySelector('#jsdocpVersions');
  if (!sel) return;
  var versioned = function(ver) {
    var parts = String(ver).split('.');
    return {
      major: (parts && parts[0] && !isNaN(parts[0]) && parseInt(parts[0])) || 0,
      minor: (parts && parts[1] && !isNaN(parts[1]) && parseInt(parts[1])) || 0,
      patch: (parts && parts[2] && !isNaN(parts[2]) && parseInt(parts[2])) || 0
    };
  };
  sel.addEventListener('change', function versionChange(event) {
    var trg = event.currentTarget || event.target, base = (trg && trg.dataset.jsdocpVersionBase) || '';
    if (trg && trg.value) window.location = (base ? base + '/' : '') + trg.value;
  });
  jp.fetch(sel.dataset.jsdocpJsonUrl, 'application/json', function versionsLoaded(error, req) {
    if (error) return console.warn(error);
    var vrs = JSON.parse(req.responseText);
    var i = vrs.length, last, curr, from = sel.dataset.jsdocpFrom ? versioned(sel.dataset.jsdocpFrom) : null;
    while (i--) { // add in reverse order 
      if (from || sel.dataset.jsdocpType) {
        if (!last) last = versioned(sel.dataset.jsdocpVersion);
        curr = versioned(vrs[i]);
        if (from && curr.major < from.major) break;
        if (from && curr.major === from.major && curr.minor < from.minor) break;
        if (from && curr.major === from.major && curr.minor === from.minor && curr.patch < from.patch) break;
        if (sel.dataset.jsdocpType === 'major' && curr.major === last.major) continue;
        if (sel.dataset.jsdocpType === 'minor' && curr.minor === last.minor) continue;
        last = curr;
      }
      opt = document.createElement('option');
      opt.setAttribute('value', vrs[i]);
      opt.appendChild(document.createTextNode(vrs[i]));
      sel.appendChild(opt);
    }
  });
};

/**
 * Replaces element(s) that have the `urlAttr` with a value ending in `.svg` with the retrieved svg content-
 * preserving the `className` of the original element
 * @param {(NodeList | Element[] | Element)} els The element(s) to replace in the DOM with retrieved svg content
 * @param {String} [urlAttr='src'] The attribute that will contain the URL to retrieve the svg content from 
 */
JSDocp.prototype.imgSvgToInline = function imgSvgToInline(els, urlAttr) {
  var jp = this;
  els = els instanceof NodeList || Array.isArray(els) ? els : (els && [els]) || [];
  urlAttr = urlAttr || 'src';
  var svgHandler = function svgHandler(error, req, el) {
    if (error) return console.warn(error);
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(req.responseText, 'text/xml');
    var svg = xmlDoc.getElementsByTagName('svg')[0];
    svg.className = el.className;
    svg.removeAttribute('xmlns:a');
    if (!svg.getAttribute('viewBox') && svg.getAttribute('height') && svg.getAttribute('width')) {
      svg.setAttribute('viewBox', '0 0 ' + svg.getAttribute('height') + ' ' + svg.getAttribute('width'));
    }
    el.parentNode.replaceChild(svg, el);
  }
  for (var i = 0, url; i < els.length && (url = els[i].getAttribute(urlAttr)); i++) {
    if (url.indexOf('.svg')) {
      if (els[i].tagName.toLowerCase() === 'iframe') els[i].outerHTML = els[i].contentWindow.document.documentElement.innerHTML;
      else jp.fetch(url, null, svgHandler, els[i]);
    }
  }
};

/**
 * Fetches resources
 * @param {String} url The URL to the resource
 * @param {String} [mime] The mime to override (if any)
 * @param {Function} [cb] The callback `function(error, request, arg)`
 * @param {*} [arg] An argument to pass to the callback as the last argument
 */
JSDocp.prototype.fetch = function fetch(url, mime, cb, arg) {
  var req = new XMLHttpRequest();
  if (mime) req.overrideMimeType(mime);
  req.open('GET', url, true);
  req.onreadystatechange = function fetched() {
    if (req.readyState === 4) {
      error = req.status !== 200 ? new Error(req.status + ' (' + req.statusText + '): Unable to capture ' + url) : null;
      if (error) error.status = req.status;
      cb(error, req, arg);
    }
  };
  req.onerror = function fetchError(error) {
    cb(error, req, arg);
  };
  req.send(null);
};