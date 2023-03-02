import { adlib, TransformsList } from 'adlib';
import { XMLBuilder } from 'fast-xml-parser';
import { defaultXmlOptions } from './index';
import { ServiceError } from './service-error';
import * as geojsonExtent from '@mapbox/geojson-extent';

export type RssDatasetTemplate = Record<string, any>;
type Feature = {
  type: string,
  geometry: Record<string, any> | undefined,
  properties: Record<string, any>
};

export function compileRssFeedEntry(
  geojsonFeature: Feature | undefined,
  feedTemplate: RssDatasetTemplate,
  feedTemplateTransforms: TransformsList): string {
  try {
    const rssItem = generateRssItem(geojsonFeature, feedTemplate, feedTemplateTransforms);
    const xmlBuilder = new XMLBuilder(defaultXmlOptions);
    const ItemsInfoXml = xmlBuilder.build(rssItem);

    return indent(ItemsInfoXml, 2);
  } catch (err) {
    throw new ServiceError(err.message, 500);
  }
}

function generateRssItem(geojsonFeature: Feature, feedTemplate: RssDatasetTemplate, feedTemplateTransforms: TransformsList): Record<string, any> {
  const { geometry, properties } = geojsonFeature;
  const rssFeedData = {
    ...properties,
    geometry
  };

  const interpolatedFields = adlib(
    feedTemplate,
    rssFeedData,
    feedTemplateTransforms
  );

  return geometry && geometry.type == 'Polygon' ? getFieldsWithGeoRss(interpolatedFields, geojsonFeature) : interpolatedFields;
}


function getFieldsWithGeoRss(rssItem: Record<string, any>, feature: Feature): Record<string, any> {
  const extent = geojsonExtent(feature.geometry);
  return {
    item: {
      ...rssItem.item,
      'georss:where': {
        'gml:Envelope': {
          'gml:lowerCorner': `${extent[1]} ${extent[0]}`,
          'gml:upperCorner': `${extent[3]} ${extent[2]}`,
        },
      }
    }
  };
}

// HUBJS CANDIDATE
export function indent(str: string, nTabs) {
  const tabs = new Array(nTabs).fill('\t').join('');
  return tabs + str.replace(/\n/g, `\n${tabs}`);
}