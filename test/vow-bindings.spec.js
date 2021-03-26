'use strict'

/*
 * adonis-session
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const { Config } = require('@adonisjs/sink')
const Macroable = require('macroable')

const SessionClient = require('../src/Session/Client')
const VowRequest = require('../src/VowBindings/Request')
const VowResponse = require('../src/VowBindings/Response')

function getResponse () {
  class Response extends Macroable {
  }
  Response._macros = {}
  Response._getters = {}
  return Response
}

function getRequest () {
  class Request extends Macroable {
    static before (fn) {
      this._hooks.push({ fn })
    }
  }

  Request._macros = {}
  Request._getters = {}
  Request._hooks = []

  return Request
}

test.group('Vow request', () => {
  test('add session getter to the request', (assert) => {
    const Request = getRequest()
    VowRequest(Request, new Config())
    const req = new Request()
    assert.instanceOf(req._session, SessionClient)
  })

  test('add macro to the request', (assert) => {
    const Request = getRequest()
    VowRequest(Request, new Config())
    const req = new Request()
    req.session('username', 'virk')
    assert.equal(req._session.get('username'), 'virk')
  })

  test('add before hook', (assert) => {
    const Request = getRequest()
    VowRequest(Request, new Config())
    assert.lengthOf(Request._hooks, 1)
    assert.isFunction(Request._hooks[0].fn)
  })
})

test.group('Vow response', () => {
  test('add session getter to the response', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())

    const res = new Response()
    assert.instanceOf(res.session.client, SessionClient)
  })

  test('instantiate store with cookies', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = { 'adonis-session-values': JSON.stringify({ name: { d: 'virk', t: 'String' } }) }
    assert.deepEqual(res.session.client._store._values, { name: 'virk' })
  })

  test('return value for a given key', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = { 'adonis-session-values': JSON.stringify({ name: { d: 'virk', t: 'String' } }) }
    assert.equal(res.session.get('name'), 'virk')
  })

  test('return flash messages', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ username: 'virk' }), t: 'Object' }
      })
    }
    assert.deepEqual(res.session.flashMessages(), { username: 'virk' })
  })

  test('return value for a flash message key', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ username: 'virk' }), t: 'Object' }
      })
    }
    assert.deepEqual(res.session.old('username'), 'virk')
  })

  test('return flash error messages', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: [{ field: 'username', message: 'foo' }] }), t: 'Object' }
      })
    }
    assert.deepEqual(res.session.errors(), [{ field: 'username', message: 'foo' }])
  })

  test('get error for a given key', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: [{ field: 'username', message: 'foo' }] }), t: 'Object' }
      })
    }
    assert.deepEqual(res.session.getErrorFor('username'), 'foo')
  })

  test('get error for a given key when errors are a plain object', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: { username: 'foo' } }), t: 'Object' }
      })
    }
    assert.deepEqual(res.session.getErrorFor('username'), 'foo')
  })

  test('throw exception when hasError assertion fails', (assert) => {
    assert.plan(2)

    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: { username: 'foo' } }), t: 'Object' }
      })
    }
    res._assert = assert
    try {
      res.session.assertErrorExists('age')
    } catch ({ message }) {
      assert.equal(message, 'There are no errors for the age field: expected false to be true')
    }
  })

  test('assert session error not exists', (assert) => {
    assert.plan(1)

    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: { username: 'foo' } }), t: 'Object' }
      })
    }
    res._assert = assert
    res.session.assertErrorNotExists('age')
  })

  test('work fine when hasError assertion passes', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: { username: 'foo' } }), t: 'Object' }
      })
    }
    res._assert = assert
    res.session.assertErrorExists('username')
  })

  test('assert error to a specific value', (assert) => {
    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: { username: 'foo' } }), t: 'Object' }
      })
    }
    res._assert = assert
    res.session.assertError('username', 'foo')
  })

  test('throw exception when error value is not same', (assert) => {
    assert.plan(2)

    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ errors: { username: 'foo' } }), t: 'Object' }
      })
    }
    res._assert = assert
    try {
      res.session.assertError('username', 'bar')
    } catch ({ message }) {
      assert.equal(message, 'expected \'foo\' to deeply equal \'bar\'')
    }
  })

  test('throw exception when session doesn\'t have value', (assert) => {
    assert.plan(2)

    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        username: { d: 'virk', t: 'String' }
      })
    }
    res._assert = assert
    try {
      res.session.assertValue('username', 'nikk')
    } catch ({ message }) {
      assert.equal(message, 'expected \'virk\' to deeply equal \'nikk\'')
    }
  })

  test('assert flash value', (assert) => {
    assert.plan(1)

    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ username: 'foo' }), t: 'Object' }
      })
    }
    res._assert = assert
    res.session.assertOld('username', 'foo')
  })

  test('assert existence of a flash value', (assert) => {
    assert.plan(1)

    const Response = getResponse()
    VowResponse(Response, new Config())
    const res = new Response()
    res.cookies = {
      'adonis-session-values': JSON.stringify({
        __flash__old: { d: JSON.stringify({ username: 'foo' }), t: 'Object' }
      })
    }
    res._assert = assert
    res.session.assertOldExists('username')
  })
})
