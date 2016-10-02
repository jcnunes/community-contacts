// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('community-contacts', ['ionic', 'ngCordova', 'mdo-angular-cryptography', 'angular.css.injector', 'community-contacts.controllers', 'community-contacts.services', 'community-contacts.directives'])
  .run(function($ionicPlatform, $rootScope, $ionicLoading, $cordovaSplashscreen, $timeout) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      $timeout(function() {
        if (window.cordova) $cordovaSplashscreen.hide();
      }, 5000);

    });
    $rootScope.$on('loading:show', function() {
      $ionicLoading.show({
        template: '<ion-spinner></ion-spinner> Loading ...'
      })
    });

    $rootScope.$on('loading:hide', function() {
      $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function() {
      $rootScope.$broadcast('loading:show');
    });

    $rootScope.$on('$stateChangeSuccess', function() {
      $rootScope.$broadcast('loading:hide');
    });

  })

.config(function($stateProvider, $urlRouterProvider, $cryptoProvider, cssInjectorProvider) {
  $cryptoProvider.setCryptographyKey('ZXYA022');

  cssInjectorProvider.setSinglePageMode(true);

  $stateProvider
    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/global.html',
      controller: 'AppCtrl'
    })

  .state('app.home', {
    url: '/home',
    views: {
      'mainContent': {
        templateUrl: 'templates/home.html',
        controller: 'IndexController'
      }
    }
  })

  .state('app.settings', {
    url: '/settings',
    views: {
      'mainContent': {
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController'
      }
    }
  })

  .state('app.sync', {
    url: '/sync',
    views: {
      'mainContent': {
        templateUrl: 'templates/sync.html',
        controller: 'SyncController'
      }
    }
  })

  .state('app.contacts', {
    url: '/contacts',
    views: {
      'mainContent': {
        templateUrl: 'templates/contacts.html',
        controller: 'ContactsController'
      }
    }
  })

  .state('app.contactdetails', {
    url: '/contact/:id',
    views: {
      'mainContent': {
        templateUrl: 'templates/contactdetail.html',
        controller: 'ContactDetailsController'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');

});
