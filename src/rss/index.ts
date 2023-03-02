import { FeedFormatterStream } from './feed-formatter-stream';
import { compileRssFeedEntry, indent } from './compile-rss-feed';
import { XmlBuilderOptions, XMLBuilder } from 'fast-xml-parser';
import { TransformsList } from 'adlib';

export const defaultXmlOptions: Partial<XmlBuilderOptions> = {
  ignoreAttributes: false,
  suppressBooleanAttributes: false,
  format: true,
  attributesGroupName: '@attributes',
  textNodeName: '@text',
  attributeNamePrefix: ''
};
const FOOTER = '\n\t</channel>\n</rss>';
const HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:georss="http://www.georss.org/georss" xmlns:gml="http://www.opengis.net/gml">
  \t<channel>`;

export function getRssDataStream(feedTemplate: any, feedTemplateTransforms: TransformsList) {
  const channelTemplate = objectWithoutKeys(feedTemplate.channel, ['item']);
  const xmlBuilder = new XMLBuilder(defaultXmlOptions);
  const channelXml = xmlBuilder.build({
    ...channelTemplate,
    docs: 'https://validator.w3.org/feed/docs/rss2.html'
  });
  const streamHeader = getStreamHeader(channelXml);

  const streamFormatter = (chunk) => {
    return compileRssFeedEntry(chunk, { item: feedTemplate.channel?.item }, feedTemplateTransforms);
  };
  
  return {
    rssStream: new FeedFormatterStream(streamHeader, FOOTER, '\n', streamFormatter)
  };
}

function getStreamHeader(templateHeader): string {
  return `${HEADER}
    ${indent(templateHeader, 2)}\n`;
}

/**
 * fast approach to remove keys from an object
 * (from babel transplier)
 */
function objectWithoutKeys(obj, keys) {
  return obj ? Object.keys(obj).reduce((newObject, key) => {
    if (keys.indexOf(key) === -1) newObject[key] = obj[key];
    return newObject;
  }, {}) : {};
}