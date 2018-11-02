As stated in the [Getting Started](1-start.html) section, all of the The configuration options provided by the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html) are retained. `jspub` only adds addtional configuration options to the existing `jsdoc` configuration `opts`.

### Configuration Options
`jspub` offers many _addon_ options in additon to the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html). A full listing of all the `jspub` _addon_ configuration options can be found under [publicize](global.html). All paths defined in the configuration are relative to the module the docs are being generated for.

#### <sub id="jspub-defaults"></sub>Default Configuration:
```jspub ./jsdoc/jsdoc-defaults.json
```
#### <sub id="jspub-example"></sub> Example `jspub` Configuration (overrides any [defaults](#jspub-defaults))
```jspub ./jspub/jsdoc.json
```

#### [Parameter Substitutions >>](tutorial-3-subs.html)