/* eslint jsx-quotes: [2, "prefer-double"] */
import vcCake from 'vc-cake'
import lodash from 'lodash'
import PropTypes from 'prop-types'

import { getAttributeType } from '../../../../../tools'

const createKey = vcCake.getService('utils').createKey
const elData = Symbol('element data')

export default class Element {
  static propTypes = {
    tag: PropTypes.string.isRequired
  }

  constructor (data, dataSettings = {}) {
    this.init(data, dataSettings)
  }

  init (data, dataSettings = {}) {
    let { id = createKey(), parent = false, tag, order, customHeaderTitle, hidden, ...attr } = data
    attr.tag = tag
    attr.id = id
    vcCake.env('debug') === true && console.warn(`Element ${tag} is not registered in system`)
    let element = {
      settings: {
        metaDescription: '',
        metaPreviewUrl: '',
        metaThumbnailUrl: '',
        name: '--'
      }
    }
    let metaSettings = element.settings
    let elSettings = {}
    for (let k in dataSettings) {
      if (dataSettings.hasOwnProperty(k)) {
        elSettings[ k ] = getAttributeType(k, dataSettings)
      }
    }
    // Split on separate symbols
    Object.defineProperty(this, elData, {
      writable: true,
      value: {
        id: id,
        tag: tag,
        parent: parent,
        data: attr,
        name: metaSettings.name,
        metaThumbnailUrl: metaSettings.metaThumbnailUrl,
        metaPreviewUrl: metaSettings.metaPreviewUrl,
        metaDescription: metaSettings.metaDescription,
        metaAssetsPath: element.assetsPath,
        metaElementPath: element.elementPath,
        metaBundlePath: element.bundlePath,
        customHeaderTitle: customHeaderTitle || '',
        order: order,
        hidden: hidden,
        settings: elSettings && elSettings.settings ? elSettings.settings : {},
        cssSettings: elSettings && elSettings.cssSettings ? elSettings.cssSettings : {},
        getAttributeType: function (k) {
          return getAttributeType(k, this.settings)
        }
      }
    })
  }

  get (k, raw = false) {
    if (Object.keys(this[ elData ]).indexOf(k) > -1) {
      return this[ elData ][ k ]
    }
    let { type, settings } = this[ elData ].getAttributeType(k)

    return type && settings ? type.getValue(settings, this[ elData ].data, k, raw) : undefined
  }

  settings (k) {
    return this[ elData ].getAttributeType(k)
  }

  get data () {
    return this[ elData ].data
  }

  set (k, v) {
    if ([ 'customHeaderTitle', 'parent' ].indexOf(k) > -1) {
      this[ elData ][ k ] = v
      return this[ elData ][ k ]
    }
    let { type, settings } = this[ elData ].getAttributeType(k)
    if (type && settings) {
      this[ elData ].data = type.setValue(settings, this[ elData ].data, k, v)
    }
    return this[ elData ].data[ k ]
  }

  toJS (raw = true, publicOnly = true) {
    let data = {}
    for (let k of Object.keys(this[ elData ].settings)) {
      let value = this.get(k, raw)
      if (value !== undefined) {
        data[ k ] = value
      }
    }
    data.id = this[ elData ].id
    data.tag = this[ elData ].tag
    data.name = this[ elData ].name
    data.metaThumbnailUrl = this[ elData ].metaThumbnailUrl
    data.metaPreviewUrl = this[ elData ].metaPreviewUrl
    data.metaDescription = this[ elData ].metaDescription
    data.metaAssetsPath = this[ elData ].metaAssetsPath
    data.metaElementPath = this[ elData ].metaElementPath
    data.metaBundlePath = this[ elData ].metaBundlePath
    if (this[ elData ].customHeaderTitle !== undefined) {
      data.customHeaderTitle = this[ elData ].customHeaderTitle
    }
    if (this[ elData ].hidden !== undefined) {
      data.hidden = this[ elData ].hidden
    } else {
      data.hidden = false
    }
    // JSON.parse can return '' for false entries
    if (this[ elData ].parent !== undefined && this[ elData ].parent !== '') {
      data.parent = this[ elData ].parent
    } else {
      data.parent = false
    }
    if (this[ elData ].order !== undefined) {
      data.order = this[ elData ].order
    } else {
      data.order = 0
    }
    if (publicOnly) {
      const publicKeys = this.getPublicKeys() // TODO: merge all data with public keys
      return lodash.pick(data, publicKeys)
    }
    return data
  }

  /**
   * Get all fields as groups: if group in group
   * Lazy list
   *
   * @param keys
   */
  relatedTo (keys) {
    const group = this.get('relatedTo')
    return group && group.has && group.has(keys)
  }

  /**
   * Get container for value from group
   * @returns [] - list of
   */
  containerFor () {
    const group = this.get('containerFor')
    if (group && group.each) {
      return group.each()
    }

    return []
  }

  /**
   * Get all attributes using getter of attributes types
   */
  getAll (onlyPublic = true) {
    return this.toJS(false, onlyPublic)
  }

  filter (callback) {
    return Object.keys(this[ elData ].settings).filter((key) => {
      let settings = this[ elData ].settings[ key ]
      let value = this.get(key)
      return callback(key, value, settings)
    })
  }

  getPublicKeys () {
    return [ 'id', 'order', 'parent', 'tag', 'customHeaderTitle', 'metaAssetsPath', 'hidden' ].concat(this.filter((key, value, settings) => {
      return settings.access === 'public'
    }))
  }

  getName () {
    return this.get('customHeaderTitle') || this.get('name')
  }
}
