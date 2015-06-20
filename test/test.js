var Vue = require('vue')
var Router = require('../src')
var nextTick = Vue.nextTick

Vue.use(Router)
// default replace to true
Vue.options.replace = true

describe('vue-router', function () {

  var router, el

  beforeEach(function () {
    el = document.createElement('div')
  })

  afterEach(function () {
    if (router) {
      router.stop()
      router = null
    }
  })

  it('matching views', function (done) {
    router = new Router()
    router.map({
      '/a': { component: 'view-a' },
      '/b': { component: 'view-b' }
    })
    var App = Vue.extend({
      template: '<div><router-view></router-view></div>',
      components: {
        'view-a': {
          template: 'AAA'
        },
        'view-b': {
          template: 'BBB'
        }
      }
    })
    router.start(App, el)
    // PhantomJS triggers the initial popstate
    // asynchronously, so we need to wait a tick
    setTimeout(function () {
      assertMatches([
        ['/a', 'AAA'],
        ['/b', 'BBB'],
        ['a', 'AAA'],
        ['b', 'BBB'],
        // no match
        ['/c', '']
      ], done)
    }, 0)
  })

  it('matching nested views', function (done) {
    router = new Router()
    router.map({
      '/a': {
        component: 'view-a',
        subRoutes: {
          '/sub-a': {
            component: 'sub-view-a'
          },
          '/sub-a-2': {
            component: 'sub-view-a-2'
          }
        }
      },
      '/b': {
        component: 'view-b',
        subRoutes: {
          '/sub-b': {
            component: 'sub-view-b'
          }
        }
      }
    })
    var App = Vue.extend({
      template: '<div><router-view></router-view></div>',
      components: {
        'view-a': {
          template: 'VIEW A <router-view></router-view>'
        },
        'view-b': {
          template: 'VIEW B <router-view></router-view>'
        },
        'sub-view-a': {
          template: 'SUB A'
        },
        'sub-view-a-2': {
          template: 'SUB A2'
        },
        'sub-view-b': {
          template: 'SUB B'
        }
      }
    })
    router.start(App, el)
    assertMatches([
      ['/a', 'VIEW A '],
      ['/a/sub-a', 'VIEW A SUB A'],
      ['/a/sub-a-2', 'VIEW A SUB A2'],
      ['/b/sub-b', 'VIEW B SUB B'],
      ['/b', 'VIEW B '],
      // no match
      ['/b/sub-a', '']
    ], done)
  })

  it('route context', function (done) {
    router = new Router()
    router.map({
      '/a/:id': { component: 'view-a' }
    })
    var App = Vue.extend({
      template:
        '<div>' +
          '<router-view></router-view>' +
          // context should be available in non-router-view
          // components too.
          '<view-b></view-b>' +
        '</div>',
      components: {
        'view-a': {
          template: '{{route.path}} {{route.params.id}} {{route.query.id}}'
        },
        'view-b': {
          template: '{{route.path}} {{route.params.id}} {{route.query.id}}'
        }
      }
    })
    router.start(App, el)
    assertMatches([
      // no param, no match (only view-b)
      ['/a', '/a  '],
      ['/a/123', '/a/123 123 /a/123 123 '],
      ['/a/123?id=123', '/a/123?id=123 123 123/a/123?id=123 123 123']
    ], done)
  })

  function assertMatches (matches, done) {
    var match = matches.shift()
    router._match(match[0])
    nextTick(function () {
      var text = router.app.$el.textContent
      expect(text).toBe(match[1])
      if (matches.length) {
        assertMatches(matches, done)
      } else {
        done()
      }
    })
  }

})
