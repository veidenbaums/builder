import vcCake from 'vc-cake'
import postcss from 'postcss'
import postcssVars from 'postcss-custom-properties'
import postcssMedia from 'postcss-custom-media'
// import postcssSimpleVars from 'postcss-simple-vars'
// import postcssColor from 'postcss-color-function'
// import postcssNested from 'postcss-nested'
import designOptions from './lib/design-options'
import rowColumn from './lib/row-column'
import CustomCss from './lib/customCss'
import GlobalCss from './lib/globalCss'
import lodash from 'lodash'

const customCss = new CustomCss()
const globalCss = new GlobalCss()

let jsFilesList = []
let cssFilesList = []

vcCake.addService('assets-manager', {
  /**
   * Up-to-date list of all elements
   *
   * @param {Object}
   */
  elements: {},
  columns: {},

  /**
   * Get cook service
   * @returns {*}
   */
  cook () {
    return vcCake.getService('cook')
  },

  /**
   * Set elements
   * @param elements
   */
  set (elements) {
    // todo: validate elements
    this.elements = elements
  },

  /**
   * Set custom css
   * @param value
   */
  setCustomCss (value) {
    customCss.data = value
  },

  /**
   * Get custom css data
   * @returns {*}
   */
  getCustomCss () {
    return customCss.data
  },

  /**
   * Set global css
   * @param value
   */
  setGlobalCss (value) {
    globalCss.data = value
  },

  /**
   * Get global css data
   * @returns {*}
   */
  getGlobalCss () {
    return globalCss.data
  },

  /**
   * Get js files list
   * @returns {*}
   */
  getJsFiles () {
    let tags = Object.keys(this.getTags())
    tags.forEach((tag) => {
      // get js files from elements
      let elementObject = this.cook().get({ tag: tag })
      let jsFiles = elementObject.get('metaPublicJs')
      if (jsFiles && jsFiles.length) {
        jsFilesList = jsFilesList.concat(jsFiles)
      }
      let assetsLibrary = elementObject.get('assetsLibrary')
      // get js file from shared assets
      if (assetsLibrary && assetsLibrary.length) {
        assetsLibrary.forEach((lib) => {
          jsFiles = this.getAssetsLibraryJsFiles(lib)
          if (jsFiles && jsFiles.length) {
            jsFilesList = jsFilesList.concat(jsFiles)
          }
        })
      }
    })
    jsFilesList = [ ...new Set(jsFilesList) ]
    return jsFilesList
  },

  /**
   * Get css files list
   * @returns {*}
   */
  getCssFiles () {
    let tags = Object.keys(this.getTags())
    tags.forEach((tag) => {
      let elementObject = this.cook().get({ tag: tag })
      let assetsLibrary = elementObject.get('assetsLibrary')

      if (assetsLibrary && assetsLibrary.length) {
        assetsLibrary.forEach((lib) => {
          let cssFiless = this.getAssetsLibraryCssFiles(lib)
          if (cssFiless && cssFiless.length) {
            cssFilesList = cssFilesList.concat(cssFiless)
          }
        })
      }
    })
    cssFilesList = [ ...new Set(cssFilesList) ]
    return cssFilesList
  },

  getAssetsLibraryCssFiles (lib) {
    let assetsLibrary = vcCake.getService('assets-library')
    let libData = assetsLibrary.get(lib)
    if (libData && libData.publicCss && libData.publicCss.length) {
      return libData.publicCss
    }
  },

  getAssetsLibraryJsFiles (lib) {
    let assetsLibrary = vcCake.getService('assets-library')
    let libData = assetsLibrary.get(lib)
    if (libData && libData.publicJs && libData.publicJs.length) {
      return libData.publicJs
    }
  },

  /**
   * Add element by id
   * @param id
   */
  add (id) {
    let ids = []
    if (Array.isArray(id)) {
      ids = id
    } else {
      ids.push(id)
    }
    ids.forEach((id) => {
      if (!this.get(id)) {
        this.update(id, true)
      }
    })
  },

  /**
   * Get element by id
   * @param assetKey
   * @returns {*}
   */
  get (assetKey = false) {
    if (!assetKey) {
      return this.elements
    }
    if (typeof this.elements[ assetKey ] === 'undefined') {
      return null
    }
    return this.elements[ assetKey ]
  },

  /**
   * Update element by id
   * @param id
   */
  update (id, force = false) {
    let ids = []
    if (Array.isArray(id)) {
      ids = id
    } else {
      ids.push(id)
    }
    ids.forEach((id) => {
      if (this.get(id) || force) {
        let documentService = vcCake.getService('document')
        let element = documentService.get(id)
        let tags = this.getElementTagsByTagName(element.tag, {}, element)
        let designOptionsData = this.cook().get(element).get('designOptions')
        let useDO = (typeof designOptionsData !== 'undefined' && designOptionsData.hasOwnProperty('used') && designOptionsData.used)
        this.elements[ id ] = {
          tags: tags,
          useDesignOptions: useDO
        }
        let columnSizes = this.getColumnSizes(element)
        if (columnSizes) {
          this.elements[ id ][ 'columnSizes' ] = columnSizes
        }
      }
    })
  },

  /**
   * Remove element by id
   * @param id
   */
  remove (id) {
    let ids = []
    if (Array.isArray(id)) {
      ids = id
    } else {
      ids.push(id)
    }
    ids.forEach((id) => {
      if (!this.get(id)) {
        return
      }
      delete this.elements[ id ]
    })
  },

  /**
   * Get element's public path
   * @param tag
   * @param file
   * @returns {*}
   */
  getPublicPath (tag, file) {
    let path = this.getSourcePath() + '/elements/' + tag + '/public'
    let $element = document.querySelector('[data-vc-element-script="' + tag + '"]')
    if ($element) {
      path = $element.dataset.vcElementUrl + '/public'
    }
    if (file) {
      path += '/' + file
    }

    return path
  },

  /**
   * Get source path
   * @param file
   * @returns {*}
   */
  getSourcePath (file = null) {
    let path
    if (vcCake.env('platform') === 'node') {
      path = window.vcvPluginUrl + 'sources'
    } else {
      path = window.vcvPluginUrl + 'public/sources'
    }
    if (file) {
      path += '/' + file
    }

    return path
  },

  /**
   * Get all used elements tags
   * @returns {{}}
   */
  getTags () {
    let tags = {}
    for (let id in this.elements) {
      let elementTags = this.elements[ id ].tags
      lodash.merge(tags, elementTags)
    }
    return tags
  },

  /**
   * Get element tags from element exact data or default settings
   * @param tag
   * @param tags
   * @param data
   * @returns {*}
   */
  getElementTagsByTagName (tag, tags, data = {}) {
    let element = this.cook().get({ tag: tag })
    let settings = element.get('settings')
    for (let key in settings) {
      // If found element than get actual tags form element
      if (settings[ key ].type === 'element') {
        if (lodash.isEmpty(data)) {
          // get tag from default value
          tags = this.getElementTagsByTagName(settings[ key ].value.tag, tags)
        } else {
          // get tad from data
          tags = this.getElementTagsByTagName(data[ key ].tag, tags, data[ key ])
        }
      }
    }
    if (!tags.hasOwnProperty(tag)) {
      tags[ tag ] = true
    }
    return tags
  },

  /**
   * Get styles object combined by tagName
   * @returns {{}}
   */
  getStyles () {
    let styles = {}
    let tags = Object.keys(this.getTags())

    tags.forEach((tag) => {
      let elementObject = this.cook().get({ tag: tag })
      let cssSettings = elementObject.get('cssSettings')
      styles[ tag ] = {
        css: cssSettings.css
      }
    })
    return styles
  },

  /**
   * Get compiled css
   * @returns {string}
   */
  getCompiledCss () {
    var iterations = []
    // add styles
    let styles = this.getStyles()
    this.updateColumns()
    for (let tagName in styles) {
      if (styles[ tagName ].css) {
        let stylePromise = new Promise((resolve, reject) => {
          postcss()
            .use(postcssVars())
            .process(styles[ tagName ].css)
            .then((result) => {
              resolve(result.css)
            })
        })
        iterations.push(stylePromise)
      }
    }
    // add columns css
    iterations = iterations.concat(this.getCompileColumnsIterations())

//       let cssTest = `
//       $dir:    top;
//       $blue:   #056ef0;
//       $column: 200px;
//       .whatever {
//         color: color(red a(10%));
//         background-color: color(red lightness(50%));
//         border-color: color(hsla(125, 50%, 50%, .4) saturation(+ 10%) w(- 20%));
//       }
//       .menu_link {
//         background: $blue;
//         width: $column;
//       }
//       .menu {
//         width: calc(4 * $column);
//         margin-$(dir): 10px;
//       }
//       .phone {
//       &_title {
//         width: 500px;
//         @media (max-width: 500px) {
//         width: auto;
//       }
//       body.is_dark & {
//         color: white;
//       }
//       }
//       img {
//         display: block;
//       }
// }`
//
//     let css = `
//
// .vce-button-xo {
//
//
//   &--style-flat {
//     &--color-$(colorName) {
//       &,
//       a&,
//       button& {
//         color: $color;
//         background-color: $background;
//         &:hover {
//           color: $color;
//           background-color: color($background shade(10%)) ;
//         }
//       }
//     }
//   }
// }
//     `
//     let vars = {
//       color:      '#000',
//       background: '#bada55',
//       colorName: 'bada55'
//     }
//
//     let compiledStyles = new Promise((resolve, reject) => {
//       postcss()
//         .use(postcssSimpleVars({
//           variables: vars,
//           silent: true
//         }))
//         .use(postcssNested)
//         .use(postcssColor)
//         .process(css)
//         .then((result) => {
//           console.log(result.css)
//           resolve(result.css)
//         })
//     })
//     iterations.push(compiledStyles)

    return Promise.all(iterations).then((output) => {
      return output.join(' ')
    })
  },

  /**
   * get design options
   * @returns {{}}
   */
  getDesignOptions () {
    let documentService = vcCake.getService('document')
    let returnOptions = {}
    let elements = this.get()
    for (let id in elements) {
      if (elements[ id ].useDesignOptions) {
        let element = documentService.get(id)
        if (element) {
          let designOptionsData = this.cook().get(element).get('designOptions')
          if (typeof designOptionsData !== 'undefined' && designOptionsData.hasOwnProperty('used') && designOptionsData.used) {
            returnOptions[ id ] = designOptionsData
          }
        }
      }
    }

    return returnOptions
  },

  /**
   * Get compiled design options css
   * @returns {Promise.<TResult>}
   */
  getCompiledDesignOptions () {
    let devices = designOptions.getDevices()
    let viewPortBreakpoints = {}
    for (let device in devices) {
      let sizes = []
      if (devices[ device ].min) {
        sizes.push('(min-width: ' + devices[ device ].min + ')')
      }
      if (devices[ device ].max) {
        sizes.push('(max-width: ' + devices[ device ].max + ')')
      }
      viewPortBreakpoints[ '--' + device ] = sizes.join(' and ')
    }

    let outputCss = []
    let designOptionsData = this.getDesignOptions()
    for (let id in designOptionsData) {
      outputCss.push(designOptions.getCss(id, designOptionsData[ id ]))
    }
    var iterations = []
    for (let style of outputCss) {
      if (style) {
        let stylePromise = new Promise((resolve, reject) => {
          postcss()
            .use(postcssMedia({ extensions: viewPortBreakpoints }))
            .process(style)
            .then((result) => {
              resolve(result.css)
            })
        })
        iterations.push(stylePromise)
      }
    }

    return Promise.all(iterations).then((output) => {
      return output.join(' ')
    })
  },

  /**
   * Set columns
   * @param columns
   */
  setColumns (columns) {
    // todo: validate elements
    this.columns = columns
  },

  /**
   * add column
   * @param column
   */
  addColumn (column) {
    let columns = []
    if (Array.isArray(column)) {
      columns = column
    } else {
      columns.push(column)
    }
    let validFormat = /^\d+\/\d+$/
    columns.forEach((column) => {
      if (validFormat.test(column)) {
        if (!this.getColumn(column)) {
          let data = column.split('/')
          if (data[ 0 ] <= data[ 1 ]) {
            this.columns[ column ] = {
              numerator: data[ 0 ],
              denominator: data[ 1 ],
              count: 1
            }
          }
        } else {
          this.columns[ column ].count++
        }
      }
    })
  },

  /**
   * Get column
   * @param assetKey
   * @returns {*}
   */
  getColumn (assetKey = false) {
    if (!assetKey) {
      return this.columns
    }
    if (typeof this.columns[ assetKey ] === 'undefined') {
      return null
    }
    return this.columns[ assetKey ]
  },

  /**
   * Remove column
   * @param column
   */
  removeColumn (column) {
    let columns = []
    if (Array.isArray(column)) {
      columns = column
    } else {
      columns.push(column)
    }
    columns.forEach((column) => {
      if (!this.getColumn(column)) {
        return
      }
      this.columns[ column ].count--
      if (this.columns[ column ].count < 1) {
        delete this.columns[ column ]
      }
    })
  },

  /**
   * get compiled columns
   * @returns {Array}
   */
  getCompileColumnsIterations () {
    let devices = rowColumn.getDevices()
    let viewPortBreakpoints = {}
    for (let device in devices) {
      viewPortBreakpoints[ '--' + device ] = '(min-width: ' + devices[ device ].min + ')'
    }

    var iterations = []
    let stylePromise = new Promise((resolve, reject) => {
      postcss()
        .use(postcssMedia({ extensions: viewPortBreakpoints }))
        .process(rowColumn.getCss(this.getColumn()))
        .then((result) => {
          resolve(result.css)
        })
    })
    iterations.push(stylePromise)

    return iterations
  },

  /**
   * Get column sizes
   * @param element
   */
  getColumnSizes (element) {
    let sizes = null
    if (element.tag === 'column' && element.size) {
      sizes = [ element.size ]
    }
    return sizes
  },

  updateColumns () {
    // for this.get()
    for (let id in this.elements) {
      if (this.elements[ id ].columnSizes && this.elements[ id ].columnSizes.length) {
        this.addColumn(this.elements[ id ].columnSizes)
      }
    }
  }
})
