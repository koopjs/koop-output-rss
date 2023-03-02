import { readableFromArray, streamToString } from '../test-helpers/stream-utils';
import { getRssDataStream } from './';
import * as datasetFromApi from '../test-helpers/mock-dataset.json';
import { jsonFromXml } from '../test-helpers/xml-parser';

async function generateRssFeed(dataset, template, templateTransforms) {
  const { rssStream } = getRssDataStream(template, templateTransforms);
  const docStream = readableFromArray([dataset]); // no datasets since we're just checking the catalog
  const feedString = await streamToString(docStream.pipe(rssStream));
  return { feed: jsonFromXml(feedString) };
}

describe('generating RSS 2 feed', () => {
  it('formats catalog correctly', async function () {
    const { feed: { rss } } = await generateRssFeed([], {}, {});
    expect(rss).toBeDefined();
    expect(rss.channel).toBeDefined();
    expect(rss.channel.docs).toBe('https://validator.w3.org/feed/docs/rss2.html');
    expect(rss['@attributes']['version']).toBe('2.0');
    expect(rss['@attributes']['xmlns:atom']).toBe('http://www.w3.org/2005/Atom');
    expect(rss['@attributes']['xmlns:georss']).toBe('http://www.georss.org/georss');
    expect(rss['@attributes']['xmlns:gml']).toBe('http://www.opengis.net/gml');
  });

  it('should interprolate dataset stream to feed based upon template', async function () {
    const rssTemplate = {
      channel: {
        title: 'awesome hub site',
        description: 'a great hub site',
        link: 'awesome.hubsite.com',
        item: {
          title: '{{name}}',
          description: '{{searchDescription}}',
          author: '{{orgContactEmail}}',
          category: '{{categories}}',
          pubDate: '{{created:toUTC}}'
        }
      }
    }

    const templateTransforms = {
      toUTC: (_key, val) => {
        return new Date(val).toUTCString();
      }
    };

    const { feed: { rss } } = await generateRssFeed(datasetFromApi, rssTemplate, templateTransforms);
    expect(rss).toBeDefined();
    expect(rss.channel).toBeDefined();
    expect(rss.channel.docs).toBe('https://validator.w3.org/feed/docs/rss2.html');
    const { channel: { item } } = rss;
    expect(item.title).toBe('Tahoe places of interest');
    expect(item.description).toBe('Description. Here be Tahoe things. You can do a lot here. Here are some more words. And a few more.with more wordsadding a few more to test how long it takes for our jobs to execute.Tom was here!');
    expect(item['georss:where']).toBeDefined();
    expect(item['georss:where']).toStrictEqual({
      'gml:Envelope': {
        'gml:lowerCorner': '35.255361 -80.724878',
        'gml:upperCorner': '35.270359 -80.703248'
      }
    })
  });
});
