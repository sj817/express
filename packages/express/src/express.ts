/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 */

import { EventEmitter } from 'node:events'
import bodyParser from 'body-parser'
import mixin from 'merge-descriptors'
import { application as proto, Application } from './application'
import { Router, Route } from 'router'
import serveStatic from 'serve-static'
import { req } from './request'
import { res } from './response'

/**
 * Create an express application.
 *
 * @api public
 */

function createApplication () {
  const app: any = function (req: any, res: any, next: any) {
    app.handle(req, res, next)
  }

  mixin(app, EventEmitter.prototype, false)
  mixin(app, Application.prototype, false)

  // expose the prototype that will get set on requests
  app.request = Object.create(req, {
    app: { configurable: true, enumerable: true, writable: true, value: app },
  })

  // expose the prototype that will get set on responses
  app.response = Object.create(res, {
    app: { configurable: true, enumerable: true, writable: true, value: app },
  })

  app.init()
  return app
}

export const express = Object.assign(createApplication, {
  application: proto,
  request: req,
  response: res,
  Route,
  Router,
  json: bodyParser.json,
  raw: bodyParser.raw,
  static: serveStatic,
  text: bodyParser.text,
  urlencoded: bodyParser.urlencoded,
})

export {
  proto as application,
  req as request,
  res as response,
  Route,
  Router,
  express as default,
}

console.log(express)
