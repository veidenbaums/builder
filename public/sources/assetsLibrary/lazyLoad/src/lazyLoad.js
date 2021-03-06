/**
 * lozad.js - v1.16.0 - 2020-09-06
 * https://github.com/ApoorvSaxena/lozad.js
 * Copyright (c) 2020 Apoorv Saxena;
 * Licensed MIT
 */

(function (window) {

  function initVcvLozad () {
    'use strict'

    /**
     * Detect IE browser
     * @const {boolean}
     * @private
     */
    const isIE = typeof document !== 'undefined' && document.documentMode

    /**
     *
     * @param {string} type
     *
     */
    const support = function support(type) {
      return window && window[type]
    }

    const validAttribute = ['data-iesrc', 'data-alt', 'data-src', 'data-srcset', 'data-background-image', 'data-toggle-class']

    const defaultConfig = {
      rootMargin: '0px',
      threshold: 0,
      enableAutoReload: false,
      load: function load(element) {
        if (element.nodeName.toLowerCase() === 'picture') {
          let img = element.querySelector('img')
          let append = false

          if (img === null) {
            img = document.createElement('img')
            append = true
          }

          if (isIE && element.getAttribute('data-iesrc')) {
            img.src = element.getAttribute('data-iesrc')
          }

          if (element.getAttribute('data-alt')) {
            img.alt = element.getAttribute('data-alt')
          }

          if (append) {
            element.append(img)
          }
        }

        if (element.nodeName.toLowerCase() === 'video' && !element.getAttribute('data-src')) {
          if (element.children) {
            const childs = element.children
            let childSrc = void 0
            for (let i = 0; i <= childs.length - 1; i++) {
              childSrc = childs[i].getAttribute('data-src')
              if (childSrc) {
                childs[i].src = childSrc
              }
            }

            element.load()
            if (element.hasAttribute('autoplay')) {
              element.play()
            }
          }
        }

        if (element.getAttribute('data-poster')) {
          element.poster = element.getAttribute('data-poster')
        }

        if (element.getAttribute('data-src')) {
          element.src = element.getAttribute('data-src')
        }

        if (element.getAttribute('data-srcset')) {
          element.setAttribute('srcset', element.getAttribute('data-srcset'))
        }

        let backgroundImageDelimiter = ','
        if (element.getAttribute('data-background-delimiter')) {
          backgroundImageDelimiter = element.getAttribute('data-background-delimiter')
        }

        if (element.getAttribute('data-background-image')) {
          element.style.backgroundImage = 'url(\'' + element.getAttribute('data-background-image').split(backgroundImageDelimiter).join('\'),url(\'') + '\')'
        } else if (element.getAttribute('data-background-image-set')) {
          const imageSetLinks = element.getAttribute('data-background-image-set').split(backgroundImageDelimiter)
          let firstUrlLink = imageSetLinks[0].substr(0, imageSetLinks[0].indexOf(' ')) || imageSetLinks[0] // Substring before ... 1x
          firstUrlLink = firstUrlLink.indexOf('url(') === -1 ? 'url(' + firstUrlLink + ')' : firstUrlLink
          if (imageSetLinks.length === 1) {
            element.style.backgroundImage = firstUrlLink
          } else {
            element.setAttribute('style', (element.getAttribute('style') || '') + ('background-image: ' + firstUrlLink + '; background-image: -webkit-image-set(' + imageSetLinks + '); background-image: image-set(' + imageSetLinks + ')'))
          }
        }

        if (element.getAttribute('data-toggle-class')) {
          element.classList.toggle(element.getAttribute('data-toggle-class'))
        }
      },
      loaded: function loaded() {}
    }

    function markAsLoaded(element) {
      element.setAttribute('data-loaded', true)
    }

    function preLoad(element) {
      if (element.getAttribute('data-placeholder-background')) {
        element.style.background = element.getAttribute('data-placeholder-background')
      }
    }

    const isLoaded = function isLoaded(element) {
      return element.getAttribute('data-loaded') === 'true'
    }

    const onIntersection = function onIntersection(load, loaded) {
      return function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.intersectionRatio > 0 || entry.isIntersecting) {
            observer.unobserve(entry.target)

            if (!isLoaded(entry.target)) {
              load(entry.target)
              markAsLoaded(entry.target)
              loaded(entry.target)
            }
          }
        })
      }
    }

    const onMutation = function onMutation(load) {
      return function (entries) {
        entries.forEach(function (entry) {
          if (isLoaded(entry.target) && entry.type === 'attributes' && validAttribute.indexOf(entry.attributeName) > -1) {
            load(entry.target)
          }
        })
      }
    }

    const getElements = function getElements(selector) {
      const root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document

      if (selector instanceof Element) {
        return [selector]
      }

      if (selector instanceof NodeList) {
        return selector
      }

      return root.querySelectorAll(selector)
    }

    function vcvLozad () {
      const selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '.vcv-lozad'
      const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}

      const _Object$assign = Object.assign({}, defaultConfig, options),
        root = _Object$assign.root,
        rootMargin = _Object$assign.rootMargin,
        threshold = _Object$assign.threshold,
        enableAutoReload = _Object$assign.enableAutoReload,
        load = _Object$assign.load,
        loaded = _Object$assign.loaded

      let observer = void 0
      let mutationObserver = void 0
      if (support('IntersectionObserver')) {
        observer = new IntersectionObserver(onIntersection(load, loaded), {
          root: root,
          rootMargin: rootMargin,
          threshold: threshold
        })
      }

      if (support('MutationObserver') && enableAutoReload) {
        mutationObserver = new MutationObserver(onMutation(load, loaded))
      }

      const elements = getElements(selector, root)
      for (let i = 0; i < elements.length; i++) {
        preLoad(elements[i])
      }

      return {
        observe: function observe() {
          const elements = getElements(selector, root)

          for (let _i = 0; _i < elements.length; _i++) {
            if (isLoaded(elements[_i])) {
              continue
            }

            if (observer) {
              if (mutationObserver && enableAutoReload) {
                mutationObserver.observe(elements[_i], { subtree: true, attributes: true, attributeFilter: validAttribute })
              }

              observer.observe(elements[_i])
              continue
            }

            load(elements[_i])
            markAsLoaded(elements[_i])
            loaded(elements[_i])
          }
          return true
        },
        triggerLoad: function triggerLoad(element) {
          if (isLoaded(element)) {
            return
          }

          load(element)
          markAsLoaded(element)
          loaded(element)
        },

        observer: observer,
        mutationObserver: mutationObserver
      }
    }

    return vcvLozad

  }

  window.vcvLozad = initVcvLozad()

  let observer = false
  window.vcv && window.vcv.on('ready', function () {
    if (!observer) {
      observer = true
      const vcvLozad = window.vcvLozad()
      vcvLozad.observe()
    }
  })

})(window)
