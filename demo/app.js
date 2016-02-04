var app = angular.module('demo', ['dgRedmine']);

app.config(function(redmineProvider){
	redmineProvider.host = "YOUR_REDMINE_HOST_HERE";
});

app.controller('myCtrl', function($scope, redmine){

	$scope.user = {
		username:'',
		password:''
	};


	$scope.wiki = {
		project:'',
		title:''
	}

	$scope.hostName = "not yet set";
	
	$scope.displayHost = function(){
		$scope.data = redmine.getHost();
	}


	$scope.login = function(){
		redmine.login($scope.user.username, $scope.user.password)
			.then(function(data){
				$scope.data = data;
			});
	}

	$scope.wikiListings = {};
	$scope.fetchListings = function(){
		redmine.wikiList($scope.wiki.project)
			.then(function(data){
				$scope.wikiListings = data;
			})
	}


	$scope.fetchWiki = function(){
		redmine.wiki($scope.wiki.project, $scope.wiki.title)
			.then(function(data){
				$scope.wikiContent = data;
			})
	}

})
