# Koop Output RSS 2.0  
![Coverage](./coverage.svg)

This is a Koop output plugin that transforms datasets from Koop Provider into a RSS 2.0 feed (with GeoRSS) encoded in XML.

Proposed channel/item RSS 2.0 XML structure: [link here](https://confluencewikidev.esri.com/display/Hub/RSS+2.0+Hub+Feeds+Structure)

See the [RSS 2.0 specification](https://www.rssboard.org/rss-2-0) for more information.

## Use
The plugin uses highly customizable feed template in JSON for field mapping which needs to be passed via Koop instance in `res.locals.feedTemplate` and `koop.server.locals.feedTemplateTransformsRss`. 

An example of the feed template is below:
```
{
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
```
Visit the [KoopJS docs](https://koopjs.github.io/docs/basics/what-is-koop) for instructions on building and deploying a Koop app.

## Develop
```
# clone and install dependencies
git clone https://github.com/koopjs/koopjs-output-rss
cd koopjs-output-rss
npm i

# starts the example Koop app found in ./example-app.
npm run dev
```

## Test
Run the `npm t` commmand to spin up the automated tests.
