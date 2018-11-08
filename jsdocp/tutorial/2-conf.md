As stated in the [Getting Started](1-start.html) section, all of the The configuration options provided by the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html) are retained. `jsdocp` only adds addtional configuration options to the existing `jsdoc` configuration `opts`.

### Configuration Options
`jsdocp` offers many _addon_ options in additon to the [`jsdoc` configuration](http://usejsdoc.org/about-configuring-jsdoc.html). A full listing of all the `jsdocp` _addon_ configuration options can be found under [publicize](global.html). All paths defined in the configuration are relative to the module the docs are being generated for.

#### <sub id="jsdocp-defaults"></sub>Default Configuration:
```jsdocp ./jsdoc/jsdoc-defaults.json
```
#### <sub id="jsdocp-example"></sub> Example `jsdocp` Configuration (overrides any [defaults](#jsdocp-defaults))
```jsdocp ./jsdocp/jsdoc.json
```

#### [Parameter Substitutions >>](tutorial-3-subs.html)