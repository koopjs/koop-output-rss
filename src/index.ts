import { Request, Response } from 'express';
import * as _ from 'lodash';
import { version } from '../package.json';
import { getRssDataStream } from './rss';
import { TransformsList } from 'adlib';
import { ServiceError } from './rss/service-error';

export = class OutputRss2 {
  static type = 'output';
  static version = version;
  static routes = [
    {
      path: '/rss/2.0',
      methods: ['get'],
      handler: 'serve',
    },
  ];

  model: any;

  public async serve(req: Request, res: Response) {
    res.set('Content-Type', 'application/rss+xml');
    try {
      const feedTemplate = req.res.locals.feedTemplate as any;
      const feedTemplateTransformsRss = req.app.locals.feedTemplateTransformsRss as TransformsList;
      if (!feedTemplate) {
        throw new ServiceError('RSS 2 feed template is not provided.', 400);
      }

      const { rssStream } = getRssDataStream(feedTemplate, feedTemplateTransformsRss);
      const datasetStream = await this.getDatasetStream(req);

      datasetStream.on('error', (err) => {
        if (req.next) {
          req.next(err);
        }
      }).pipe(rssStream).pipe(res);
      
    } catch (err) {
      res.set('Content-Type', 'application/json');
      res.status(err.statusCode).send(this.getErrorResponse(err));
    }
  }

  private async getDatasetStream(req: Request) {
    try {
      return await this.model.pullStream(req);
    } catch (err) {
      if (err.status === 400) {
        throw new ServiceError(err.message, err.status || 500);
      }
      throw new ServiceError(err.message, err.status || 500);
    }
  }

  private getErrorResponse(err: any) {
    return {
      error: _.get(
        err,
        'message',
        'Encountered error while processing request',
      ),
    };
  }
};