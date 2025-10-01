const config = require('config');
const Koop = require('koop');
const plugins = require('./plugins');

// initiate a koop app
const koop = new Koop();

koop.server.locals = {
  ...koop.server.locals,
  arcgisPortal: 'https://www.arcgis.com',
  feedTemplateTransformsRss: {
    toUTC: (_key, val) => {
      return new Date(val).toUTCString();
    }
  }
};

koop.server.use(function (req, res, next) {
  res.locals = {
    ...res.locals,
    searchRequestBody: {
      filter: {
        group: ['6e23b09ac3944b3fb1f98b34a9fc33c4', '358380575024451b8a0e496d871ad731', '455c193b5e044d7c862080fd1087c656']
      },
      options: {
        fields: 'name,description,tags,created,modified,owner,orgContactEmail,extent,license'
      }
    },
    siteIdentifier: 'opendata.dc.gov',
    feedTemplate: {
      channel: {
        title: 'ArcGIS Hubsite',
        description: 'ArcGIS Hub is an easy-to-configure cloud platform that organizes people, data, and tools to accomplish Initiatives and goals.',
        link: 'https://hub.arcgis.com/',
        category: 'Opendata',
        item: {
          title: '{{name}}',
          description: '{{searchDescription}}',
          author: '{{orgContactEmail}}',
          category: '{{categories}}',
          pubDate: '{{created:toUTC}}'
        }
      }
    }
  };
  next();
});

// register koop plugins
plugins.forEach((plugin) => {
  koop.register(plugin.instance, plugin.options);
});
// start the server
koop.server.listen(config.port, () => koop.log.info(`Koop server listening at ${config.port}`));
