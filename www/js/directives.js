'use strict';

angular.module('community-contacts.directives', [])

.directive('communityContactsHeader', function() {

  var controller = ['$scope', '$state', function($scope, $state) {

    $scope.goBack = function(state) {
      $state.go(state)
    }

  }]

  return {
    restrict: 'E', //E = element, A = attribute, C = class, M = comment
    scope: {
      //@ reads the attribute value, = provides two-way binding, & works with functions
      logo: '@',
      user: '@',
      sync: '=',
      syncMethod: '&',
      backState: '@'
    },
    templateUrl: 'templates/header.html',
    controller: controller,
    link: function($scope, element, attrs) {} //DOM manipulation
  }
})
