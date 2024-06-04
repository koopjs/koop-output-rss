import { mocked } from 'ts-jest/utils';
import * as express from 'express';
import * as request from 'supertest';
import * as _ from 'lodash';
import * as mockSiteModel from './test-helpers/mock-site-model.json';
import * as mockDataset from './test-helpers/mock-dataset.json';
import { readableFromArray } from './test-helpers/stream-utils';
import { ServiceError } from './rss/service-error';
import { jsonFromXml } from './test-helpers/xml-parser';
import { PassThrough } from 'stream';

describe('Output Plugin', () => {
  let mockFetchSite;
  let plugin;
  let app: express.Application;

  const siteHostName = 'download-test-qa-pre-a-hub.hubqa.arcgis.com';

  function buildPluginAndApp(feedTemplate, feedTemplateTransforms) {
    let Output;

    jest.isolateModules(() => {
      Output = require('./');
    });

    const plugin = new Output();
    plugin.model = {
      pullStream: jest.fn().mockResolvedValue(readableFromArray([mockDataset])),
    };

    app = express();
    app.get('/rss', function (req, res, next) {
      req.app.locals.feedTemplateTransformsRss = feedTemplateTransforms;
      res.locals.feedTemplate = feedTemplate;
      app.use((err, _req, res, _next) => {
        res.status(err.status || 500)
        res.send({
          error: err.message
        })
      })
      next();
    }, plugin.serve.bind(plugin));

    return [plugin, app];
  }

  beforeEach(() => {
    const { fetchSite } = require('@esri/hub-common');
    // this fancy code is just to _only_ mock some fns
    // and leave the rest alone
    jest.mock('@esri/hub-common', () => ({
      ...(jest.requireActual('@esri/hub-common') as object),
      fetchSite: jest.fn(),
      hubApiRequest: jest.fn()
    }));

    const rssTemplate = {
      channel: {
        title: 'awesome hub site',
        description: 'a great hub site',
        link: 'awesome.hubsite.com',
        item: {
          title: '{{name}}',
          description: '{{searchDescription}}',
          author: '{{orgContactEmail}}',
          category: '{{categories}}'
        }
      }
    }

    mockFetchSite = mocked(fetchSite);

    mockFetchSite.mockResolvedValue(mockSiteModel);

    [plugin, app] = buildPluginAndApp(rssTemplate, {});
  });

  it('is configured correctly', () => {
    expect(plugin.constructor.type).toBe('output');
    expect(plugin.constructor.version).toBeDefined();
    expect(plugin.constructor.routes).toEqual([
      {
        path: '/rss/2.0',
        methods: ['get'],
        handler: 'serve',
      }
    ]);
  });

  it('throws error if feed template is not found in request', async () => {
    // rebuild plugin to trigger initialization code
    const [plugin, localApp] = buildPluginAndApp(undefined, undefined);
    try {
      await request(localApp)
        .get('/rss')
        .set('host', siteHostName)
        .expect('Content-Type', /application\/json/);
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toHaveProperty('statusCode', 400);
      expect(plugin.model.pullStream).toHaveBeenCalledTimes(1);
    }
  });

  it('handles a RSS request', async () => {
    // rebuild plugin to trigger initialization code
    await request(app)
      .get('/rss')
      .set('host', siteHostName)
      .expect('Content-Type', 'application/rss+xml')
      .expect(200)
      .expect(res => {
        expect(res.text).toBeDefined();
        const rssStream = res.text;
        const rssFeed = jsonFromXml(rssStream);
        const { rss: { channel } } = rssFeed;
        expect(channel).toBeDefined();
        expect(channel.title).toBe('awesome hub site');
        expect(channel.description).toBe('a great hub site');
        expect(channel.link).toBe('awesome.hubsite.com');
        expect(channel.docs).toBe('https://validator.w3.org/feed/docs/rss2.html');
        expect(channel.item).toBeDefined();
      });
  });

  it('sets status to 500 if something blows up', async () => {
    plugin.model.pullStream.mockRejectedValue(Error('Couldnt get stream'));

    await request(app)
      .get('/rss')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(500)
      .expect((res) => {
        expect(res.body).toEqual({ error: 'Couldnt get stream' });
      });

    // TODO test stream error
  });

  it('returns 400 when searchRequest returns 400', async () => {
    [plugin, app] = buildPluginAndApp({}, {});

    plugin.model = {
      pullStream: jest.fn().mockRejectedValue({ status: 400, message: 'A validation error' })
    }

    await request(app)
      .get('/rss')
      .set('host', siteHostName)
      .expect('Content-Type', /application\/json/)
      .expect(400)
      .expect(res => {
        expect(plugin.model.pullStream).toHaveBeenCalledTimes(1);
        expect(res.body).toBeDefined();
        expect(res.body.error).toEqual('A validation error');
      });
  });

  it('returns error if stream emits an error', async () => {
    const mockReadable = new PassThrough();

    plugin.model.pullStream.mockResolvedValue(mockReadable);
    const mockError = new Error('stream error')

    setTimeout(() => {
      mockReadable.emit('error', mockError)
    }, 200)
    await request(app)
      .get('/rss')
      .set('host', siteHostName)
      .expect(500)
      .expect((res) => {
        expect(res.text).toEqual(JSON.stringify({ error: 'stream error' }));
      });
  });
});