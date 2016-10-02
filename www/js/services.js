'use strict';

angular.module('community-contacts.services', ['ngResource'])

.constant('baseURL', "http://community-contacts-backend.herokuapp.com/v1/")

.service('dbService', function() {

  this.getDb = function() {
    return new PouchDB('community-contacts')
  }

})

.factory('$localStorage', ['$window', function($window) {
  return {
    store: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    storeObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key, defaultValue) {
      return JSON.parse($window.localStorage[key] || defaultValue);
    }
  }
}])

.service('settingsService', ['$localStorage', 'baseURL', function($localStorage, baseURL) {

  var baseUrlStorageKey = 'baseUrlSettings'
  var userSettingsStorageKey = 'userSettings'

  this.getCurrentUser = function() {
    return $localStorage.getObject(userSettingsStorageKey, JSON.stringify({username: 'joana.nunes228@gmail.com'}))
  }

  this.saveCurrentUser = function(userId) {
    $localStorage.storeObject(userSettingsStorageKey, {username: userId})
  }

  this.getBaseUrl = function() {
    return $localStorage.get(baseUrlStorageKey, baseURL)
  }

  this.saveBaseUrl = function(newUrl) {
    $localStorage.store(baseUrlStorageKey, newUrl)
  }

}])

.service('contactsService', ['dbService', function(dbService) {

  this.getContacts = function() {
    return dbService
      .getDb()
      .allDocs({
        include_docs: true
      })
  }

  this.getContact = function(contactId) {
    return dbService
      .getDb()
      .get(contactId.replace(/[^0-9a-z]/gi, ''))
  }

  this.removeAllContacts = function() {
    return dbService
      .getDb()
      .destroy()
  }

  this.saveContact = function(contact) {
    var id = contact.base_contact.contact_id.replace(/[^0-9a-z]/gi, '')
    contact._id = id
    return dbService
      .getDb()
      .get(id)
      .then(function(doc) {
        contact._rev = doc._rev
        return dbService
          .getDb()
          .put(contact)
      })
      .catch(function(err) {
        return dbService
          .getDb()
          .put(contact)
      })
  }

}])

.service('connectionService', ['$localStorage', '$ionicPlatform', '$cordovaNetwork', function($localStorage, $ionicPlatform, $cordovaNetwork) {

  this.hasConnection = function() {
    if (window.cordova) {
      $ionicPlatform.ready(function() {
        return $cordovaNetwork.isOnline()
      })
    }
    return true // always online for dev server
  }

}])

.service('loginService', ['$q', '$resource', '$localStorage', '$crypto', 'settingsService', function($q, $resource, $localStorage, $crypto, settingsService) {

  var hashStorageKey = 'pwdHash';

  var doLoginOnline = function(username, password) {
    return $resource(settingsService.getBaseUrl() + "users/login")
      .save({
        username: username,
        password: password
      })
      .$promise
      .then(function(res) {
        res.offline = false
        return res
      })
      .catch(function(err) {
        var statusText = 'Could not reach the server'
        if (err.data && err.data.err) {
          if (err.data.err.message) {
            statusText = err.data.err.message
          }
          else {
            statusText = err.data.err
          }
        } else if (err.statusText) {
          statusText = err.statusText
        }

        throw {code: err.status, message: statusText}
      });
  }

  var doLoginOffline = function(password) {
    return $q(function(resolve, reject) {
      if (password === $crypto.decrypt($localStorage.get(hashStorageKey, ''))) {
        resolve({
          success: true,
          token: null,
          offline: true
        })
      } else {
        reject(new Error('Incorrect authentication data.'))
      }
    })
  }

  var isOnlineMode = function(hasConnection) {
    return hasConnection || false
  }

  this.doLogin = function(username, password, hasConnection) {
    if (isOnlineMode(hasConnection)) {
      return doLoginOnline(username, password)
    }

    return doLoginOffline(password)
  }

  this.updateSecretHash = function(password, hasConnection) {
    if (isOnlineMode(hasConnection)) {
      $localStorage.store(hashStorageKey, $crypto.encrypt(password))
    }

    return $q.resolve(true)
  }

}])

.service('syncService', ['$q', '$resource', '$localStorage', 'settingsService', 'contactsService', function($q, $resource, $localStorage, settingsService, contactsService) {

  var syncDetails = function(contacts, token, progressCb) {
    var contactDetailsPromises = [contactsService.removeAllContacts()]

    var inc = 75 / contacts.length

    contacts.map(function(contact) {
      contactDetailsPromises.push(function() {
        return $resource(settingsService.getBaseUrl() + "contacts/:id", {}, {
            get: {
              method: 'GET',
              headers: {
                'x-access-token': token
              }
            }
          })
          .get({
            id: contact.contact_id
          })
          .$promise
          .then(function(contactDetails) {
            return contactsService.saveContact({
              base_contact: contactDetails.base_contact,
              details: contactDetails.details
            })
          })
          .then(function(contactDetails) {
            progressCb(inc)
            return true
          })
      })
    })

    var promisesSeq = contactDetailsPromises.reduce(function(acc, val) {
      return acc
        .then(val)
    }, $q.resolve())

    return promisesSeq
      .then(function() {
        return contacts.length
      })
  }

  this.syncData = function(token, progressCb) {
    return $resource(settingsService.getBaseUrl() + "contacts", {}, {
        query: {
          method: 'GET',
          isArray: true,
          headers: {
            'x-access-token': token
          }
        }
      })
      .query()
      .$promise
      .then(function(contacts) {
        progressCb(25)
        return syncDetails(contacts, token, progressCb)
      })
      .catch(function(err) {
        var statusText = 'Could not reach the server'
        if (err.data && err.data.err) {
          statusText = err.data.err
        } else if (err.statusText) {
          statusText = err.statusText
        }

        throw new Error(statusText)
      });
  }

}])

.filter('contactFilter', function() {
  return function(contacts, q) {
    if (!contacts || !q || q === '') return contacts

    var query = q.toLowerCase()
    return contacts.filter(function(contact) {
      var contactData = contact.doc.base_contact
      var matchFound = false
      Object.keys(contactData).forEach(function(key) {
        if (contactData[key].toLowerCase().indexOf(query) === 0) matchFound = true
      })
      return matchFound
    })
  }
});
