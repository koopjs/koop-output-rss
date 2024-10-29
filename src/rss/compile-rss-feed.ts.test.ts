import { compileRssFeedEntry } from './compile-rss-feed';
import * as datasetFromApi from '../test-helpers/mock-dataset.json';
import { ServiceError } from './service-error';
import { jsonFromXml } from '../test-helpers/xml-parser';
import * as _ from 'lodash';

describe('generating RSS 2 feed', () => {
  it('should throw 400 RSS error if template contains transformer that is not defined', async function () {
    const rssItemTemplate = {
      item: {
        title: '{{name}}',
        description: '{{searchDescription}}',
        author: '{{orgContactEmail}}',
        category: '{{categories}}',
        pubDate: '{{created:toUTC}}'
      }
    };

    try {
      compileRssFeedEntry(datasetFromApi, rssItemTemplate, {});
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toHaveProperty('statusCode', 500);
    }
  });

  it('should throw error if geojson from provider is missing', async function () {
    const rssItemTemplate = {
      item: {
        title: '{{name}}',
        description: '{{searchDescription}}',
        author: '{{orgContactEmail}}',
        category: '{{categories}}',
        pubDate: '{{created:toUTC}}'
      }
    };

    expect(() => {
      compileRssFeedEntry(undefined, rssItemTemplate, {});
    }).toThrow(ServiceError);
  });

  it('should convert to valid georss gml:Envelope if geojson contains geometry of polygon type', async function () {
    const rssItemTemplate = {
      item: {
        title: '{{name}}',
        description: '{{searchDescription}}',
        author: '{{orgContactEmail}}',
        category: '{{categories}}',
        pubDate: '{{created:toUTC}}'
      }
    };

    const templateTransforms = {
      toUTC: (_key, val) => {
        return new Date(val).toUTCString();
      }
    };

    const itemRss = compileRssFeedEntry(datasetFromApi, rssItemTemplate, templateTransforms);
    const { item } = jsonFromXml(itemRss);
    expect(item['georss:where']).toBeDefined();
    expect(item['georss:where']).toStrictEqual({
      'gml:Envelope': {
        'gml:lowerCorner': '35.255361 -80.724878',
        'gml:upperCorner': '35.270359 -80.703248'
      }
    })
  });

  it('should not set georss if geojson feature does not have geometry', async function () {
    const datasetFromApiWithoutGeometry = {
      type: "Feature",
      geometry: undefined,
      properties: {
        name: 'test'
      }
    };

    const rssItemTemplate = {
      item: {
        title: '{{name}}',
        description: '{{searchDescription}}',
        author: '{{orgContactEmail}}',
        category: '{{categories}}',
        pubDate: '{{created:toUTC}}'
      }
    };

    const templateTransforms = {
      toUTC: (_key, val) => {
        return new Date(val).toUTCString();
      }
    };
    
    const itemRss = compileRssFeedEntry(datasetFromApiWithoutGeometry, rssItemTemplate, templateTransforms);
    const { item } = jsonFromXml(itemRss);
    expect(item).toBeDefined();
    expect(item['georss:where']).toBeUndefined();
   
  });

  it('should use interpolated template georss if RSS template contains georss', async function () {
    const rssItemTemplate = {
      item: {
        title: '{{name}}',
        description: '{{searchDescription}}',
        author: '{{orgContactEmail}}',
        category: '{{categories}}',
        'georss:where': '{{boundary:toGeoRss}}'
      }
    };

    const templateTransforms = {
      toGeoRss: (_key, _val) => {
        return {
          'gml:Envelope': {
            'gml:lowerCorner': '1 2',
            'gml:upperCorner': '3 4'
          }
        };
      }
    };

    const itemRss = compileRssFeedEntry(datasetFromApi, rssItemTemplate, templateTransforms);
    const { item } = jsonFromXml(itemRss);
    expect(item['georss:where']).toBeDefined();
    expect(item['georss:where']).toStrictEqual({
      'gml:Envelope': {
        'gml:lowerCorner': '1 2',
        'gml:upperCorner': '3 4'
      }
    })
  });

  it('should remove georss key if interpolated georss is undefined', async function () {
    const rssItemTemplate = {
      item: {
        title: '{{name}}',
        description: '{{searchDescription}}',
        author: '{{orgContactEmail}}',
        category: '{{categories}}',
        'georss:where': '{{boundary:toGeoRss}}'
      }
    };

    const templateTransforms = {
      toGeoRss: (_key, _val) => {
        return undefined;
      }
    };

    const itemRss = compileRssFeedEntry(datasetFromApi, rssItemTemplate, templateTransforms);
    const { item } = jsonFromXml(itemRss);
    expect(item['georss:where']).toBeUndefined();
  });

});