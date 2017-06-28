/* global console */
const execFile = require('child-process-promise').exec
const fs = require('fs-extra')
const path = require('path')
class ElementsBuilder {
  constructor (dir, repo, accountRepo) {
    Object.defineProperties(this, {
      /**
       * @property {String}
       * @name ElementsBuilder#dir
       */
      'dir': {
        value: dir,
        writable: false
      },
      /**
       * @property {String}
       * @name ElementsBuilder#accountRepo
       */
      'accountRepo': {
        value: accountRepo,
        writable: false
      },
      /**
       * @property {String}
       * @name ElementsBuilder#repo
       */
      'repo': {
        value: repo,
        writable: false
      },
      /**
       * @property {String}
       * @name ElementsBuilder#elementsDir
       */
      'elementsDir': {
        value: `elements`,
        writable: false
      },
      /**
       * @property {String}
       * @name ElementsBuilder#elementsPath
       */
      'elementsPath': {
        get: () => {
          return path.join(this.dir, this.repoDir, this.elementsDir)
        }
      },
      /**
       * @property {String}
       * @name ElementsBuilder#repoDir
       */
      'repoDir': {
        value: `vcwb-builder-1498647287420`,
        writable: false
      },
      /**
       * @property {String}
       * @name ElementsBuilder#repoPath
       */
      'repoPath': {
        get: () => {
          return path.join(this.dir, this.repoDir)
        }
      },
      /**
       * @property {String}
       * @name ElementsBuilder#accountRepoDir
       */
      'accountRepoDir': {
        value: `vcwb-account-${+new Date()}`,
        writable: false
      },
      /**
       * @property {String}
       * @name ElementsBuilder#bundleDir
       */
      'bundleDir': {
        value: `vcwb-bundle-${+new Date()}`,
        writable: false
      },
      /**
       * @property {String}
       * @name ElementsBuilder#bundleDir
       */
      'bundlePath': {
        get: () => {
          return path.join(this.dir, this.bundleDir)
        }
      }
      ,
      /**
       * @property {String}
       * @name ElementsBuilder#bundleData
       */
      'bundleData': {
        enumerable: false,
        configurable: false,
        value: {},
        writable: true
      }
    })
  }

  build (elements, commit, version, callback) {
    console.log('Cloning repositories...')
    Promise.all([ this.cloneRepoAsync(commit), this.cloneAccountRepoAsync() ]).then(() => {
      console.log('Cloning elements repos and copy bundle files...')
      Promise.all([ this.copyFilesAsync(), this.cloneElementsReposAsync(elements) ]).then(() => {
        console.log('Building VCWB...')
        Promise.all([ this.readBundleJSONFileAsync(), this.buildVCWB() ]).then(() => {
          this.updateBundlDataWithVersion(version)
          console.log('Building elements and copying files from bundle pre-build to a new package directory...')
          this.buildElementsAsync(elements).then(() => {
            console.log('Copy editor files and update elements settings in bundle data...')
            Promise.all([ this.updateBundleDataWithElementsSettingsAsync(elements), this.copyEditorsFilesAsync() ]).then(() => {
              console.log('Clean up elements and update bundle.json file...')
              Promise.all([ this.cleanUpElementsAsync(elements), this.updateBundleJSONFileAsync() ]).then(() => {
                console.log('Copying elements to bundle list...')
                this.copyElementsFilesAsync().then(() => {
                  console.log('Creating zip archive...')
                  this.createZipArchiveAsync(version).then(this.removeRepoDirsAsync.bind(this))
                  callback()
                })
              })
            })
          })
        })
      })
    })
  }

  exec (cmd, options = {}) {
     return execFile(cmd, options).catch((result) => {console.log(result)})
  }

  clone (repo, path, commit) {
    console.log(`Cloning ${repo}...`)
    let cloneCMD = `git clone --depth 1 ${repo} ${path}`
    if (commit) {
      cloneCMD = `git clone ${repo} ${path} && cd ${path} && git reset --hard ${commit}`
    }
    return this.exec(cloneCMD)
  }

  cloneRepoAsync (commit) {
    return this.clone(this.repo, this.repoPath, commit)
  }

  cloneAccountRepoAsync () {
    const accountRepoDir = path.join(this.dir, this.accountRepoDir)
    return this.clone(this.accountRepo, accountRepoDir)
  }

  buildVCWB () {
    return this.exec('npm install && npm run build-production', {
      cwd: this.repoPath
    })
  }

  cloneElementsReposAsync (elements) {
    const promises = []
    // Clone
    fs.ensureDirSync(this.elementsPath)
    elements.forEach((tag) => {
      promises.push(this.clone(`git@gitlab.com:visualcomposer-hub/${tag}.git`, path.join(this.elementsPath, tag)))
    })
    return Promise.all(promises)
  }

  buildElement (path) {
    console.log(`Building element in ${path}...`)
    return this.exec('npm run build && sed -i "" "s:../../node_modules/:./node_modules/:g" public/dist/element.bundle.js ', {
      cwd: path
    })
  }

  buildElementsAsync (elements) {
    const promises = []
    elements.forEach((tag) => {
      const elementDir = path.join(this.elementsPath, tag)
      promises.push(this.buildElement(elementDir))
    })
    return Promise.all(promises)
  }

  copyEditorsFilesAsync () {
    const promises = []
    const join = path.join
    const distPath = join(this.repoPath, 'public', 'dist')
    const bundleEditorPath = join(this.bundlePath, 'editor')
    const assets = [
      'pe.bundle.css',
      'pe.bundle.js',
      'wp.bundle.css',
      'wp.bundle.js',
      'wpbackend.bundle.css',
      'wpbackend.bundle.js',
      'wpbackendswitch.bundle.css',
      'wpbackendswitch.bundle.js',
      'front.bundle.js',
      'fonts',
      'images'
    ]
    assets.forEach((asset) => {
      promises.push(fs.copy(join(distPath, asset), join(bundleEditorPath, asset)))
    })
    return Promise.all(promises)
  }

  copyFilesAsync () {
    const accountRepoDir = path.join(this.dir, this.accountRepoDir, 'resources', 'bundle-prebuild')
    const bundleDir = path.join(this.dir, this.bundleDir)
    return fs.move(accountRepoDir, bundleDir)
  }

  cleanUpElementsAsync (elements) {
    const promises = []
    const join = path.join
    elements.forEach((tag) => {
      const elementPath = join(this.elementsPath, tag)
      promises.push(fs.remove(join(elementPath, '.git')))
      promises.push(fs.remove(join(elementPath, '.gitignore')))
      promises.push(fs.remove(join(elementPath, 'package.json')))
      promises.push(fs.remove(join(elementPath, 'webpack.config.js')))
      promises.push(fs.remove(join(elementPath, 'public', 'dist', 'vendor.bundle.js')))
      promises.push(fs.remove(join(elementPath, 'public', 'dist', '.gitkeep')))
      promises.push(fs.remove(join(elementPath, tag, 'settings.json')))
      promises.push(fs.remove(join(elementPath, tag, 'component.js')))
      promises.push(fs.remove(join(elementPath, tag, 'index.js')))
      promises.push(fs.remove(join(elementPath, tag, 'styles.css')))
      promises.push(fs.remove(join(elementPath, tag, 'editor.css')))
      promises.push(fs.remove(join(elementPath, tag, 'cssMixins')))
      promises.push(fs.remove(join(elementPath, tag, 'public', 'src')))
    })
    return Promise.all(promises)
  }

  copyElementsFilesAsync () {
    return fs.move(this.elementsPath, path.join(this.bundlePath, 'elements'))
  }

  readBundleJSONFileAsync () {
    const jsFile = path.join(this.bundlePath, 'bundle.json')
    return fs.readJson(jsFile).then((data) => {
      this.bundleData = data
    })
  }

  updateBundleDataWithElementsSettingsAsync (elements) {
    const promises = []
    elements.forEach((tag) => {
      const elementSettingsPath = path.join(this.elementsPath, tag, tag, 'settings.json')
      promises.push(fs.readJSON(elementSettingsPath).then((data) => {
        this.bundleData.elements[ tag ] = data
      }))
    })
    return Promise.all(promises)
  }

  updateBundleJSONFileAsync () {
    const jsFile = path.join(this.bundlePath, 'bundle.json')
    return fs.writeJson(jsFile, this.bundleData)
  }

  updateBundlDataWithVersion (version = '0.2') {
    this.bundleData.editor = version
  }

  createZipArchiveAsync (version) {
    const bundleZipPath = path.join(this.dir, `bundle-${version}.zip`)
    return this.exec(`cd ${this.bundlePath} && zip -r ${bundleZipPath} ./*`)
  }

  removeRepoDirsAsync () {
    console.log('Removing temp directories...')
    const accountRepoDir = path.join(this.dir, this.accountRepoDir)
    const promises = []
    promises.push(fs.remove(this.repoPath))
    promises.push(fs.remove(accountRepoDir))
    promises.push(fs.remove(this.bundlePath))
    return Promise.all(promises)
  }
}
module.exports = ElementsBuilder