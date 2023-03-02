const HubSearch = require('@koopjs/koop-provider-hub-search')
const OutputRss = require('@koopjs/output-rss')

// list different types of plugins in order
const outputs = [
  {
    instance: OutputRss
  }
]
const auths = []
const caches = []
const plugins = [
  {
    instance: HubSearch
  }
]

module.exports = [...outputs, ...auths, ...caches, ...plugins]
