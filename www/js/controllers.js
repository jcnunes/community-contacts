angular.module('community-contacts.controllers', [])

.controller('AppCtrl', function($scope, $state, settingsService, cssInjector) { // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  cssInjector.add('css/test.css')

  $scope.userId = settingsService.getCurrentUser().username
  $scope.logo = 'img/ionic.png'

  $scope.syncMethod = function() {
    $state.go('app.sync')
  }

})

.controller('IndexController', ['$scope', '$window', '$state', '$ionicPlatform', '$cordovaLocalNotification', '$cordovaToast', 'connectionService', 'loginService', 'settingsService', function($scope, $window, $state, $ionicPlatform, $cordovaLocalNotification, $cordovaToast, connectionService, loginService, settingsService) {
  $scope.message = ''
  $scope.loginData = {
    password: ''
  };

  $scope.openSettings = function() {
    $state.go('app.settings');
  };

  $scope.passwordEntered = function() {
    $scope.message = ''

    var hasConnection = connectionService.hasConnection()

    var currentUser = settingsService.getCurrentUser()
    var username = currentUser && currentUser.username ? currentUser.username : ''

    loginService
      .doLogin(username, $scope.loginData.password, hasConnection)
      .then(function(res) {
        if (res.offline) {
          $state.go('app.contacts')
          return
        }

        if (!res.success || !res.token) {
          throw new Error('Invalid response.')
        }

        currentUser.token = res.token

        return loginService
          .updateSecretHash($scope.loginData.password, hasConnection)
          .then(function(res) {
            $window.localStorage['token'] = currentUser.token
            $state.go('app.sync')
          })
      })
      .catch(function(err) {
        console.log(err)
        $scope.message = err.message || 'An unknown error occurred. Please retry...'
      })
  };
}])

.controller('SyncController', ['$scope', '$window', '$state', '$stateParams', '$ionicPlatform', '$cordovaLocalNotification', '$cordovaToast', 'syncService', function($scope, $window, $state, $stateParams, $ionicPlatform, $cordovaLocalNotification, $cordovaToast, syncService) {
  $scope.progress = 0
  $scope.syncing = false

  var incrementProgress = function(inc) {
    var progress = $scope.progress + inc
    $scope.progress = Math.min(Math.round(progress), 100)
  }

  var doSync = function(token) {
    $scope.progress = 0
    $scope.syncing = true

    syncService
      .syncData(token, function(progress) {
        incrementProgress(progress)
      })
      .then(function(count) {
        $scope.syncing = false

        if (window.cordova) {
          $ionicPlatform.ready(function() {
            $cordovaLocalNotification.schedule({
              title: "Community contacts sync'ed",
              text: 'Updated ' + count + ' community contacts.'
            })

            $cordovaToast
              .show('Finished updating community contacts', 'long', 'center')
          })
        }

        $state.go('app.contacts')
      })
      .catch(function(err) {
        console.log(err)
        $scope.syncing = false

        if (window.cordova) {
          $ionicPlatform.ready(function() {
            $cordovaLocalNotification.schedule({
              title: 'Community contacts sync failed',
              text: 'Community contacts update failed. Please review connection settings.'
            })

            $cordovaToast
              .show('Failed updating community contacts', 'long', 'center')
          })
        }

        $state.go('app.contacts')
      })
  }

  $scope.$on('$ionicView.beforeEnter', function() {
    doSync($window.localStorage['token'] || '')
  })

}])

.controller('ContactsController', ['$scope', 'contactsService', 'connectionService', function($scope, contactsService, connectionService) {
  $scope.loading = true;
  $scope.q = ''
  $scope.error = null
  $scope.online = connectionService.hasConnection()

  contactsService
    .getContacts()
    .then(function(res) {
      $scope.contacts = res.rows
    })
    .catch(function(err) {
      console.log('err', err)
      $scope.error = 'Unexpected error'
    })

}])

.controller('ContactDetailsController', ['$scope', '$stateParams', 'contactsService', function($scope, $stateParams, contactsService) {

  $scope.contact = null

  contactsService
    .getContact($stateParams.id)
    .then(function(res) {
      $scope.contact = res
      $scope.showMenu = true
    })
    .catch(function(err) {
      console.log('err', err)
      $scope.error = 'Unexpected error'
    })

}])

.controller('SettingsController', ['$scope', '$state', '$ionicPopup', 'settingsService', function($scope, $state, $ionicPopup, settingsService) {

  $scope.server = settingsService.getBaseUrl()
  $scope.userId = settingsService.getCurrentUser().username

  $scope.discard = function() {
    $state.go('app.home')
    return false
  }

  $scope.saveSettings = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Update settings',
      template: 'Are you sure you want to update the application settings?'
    });

    confirmPopup
      .then(function(res) {
        if (res) {
          settingsService.saveBaseUrl($scope.server)
          settingsService.saveCurrentUser($scope.userId)

          $state.go('app.home')
        }
      })
  }

}])

;
