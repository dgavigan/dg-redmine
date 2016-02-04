
angular.module("dgRedmine", ['LocalForageModule']);


angular.module('dgRedmine').provider('redmine', [
	function(){

		var self = this;

		self.host = "localhost";
		self.Crosshost="https://crossorigin.me/";
		self.useJson = true;

		self.defaultCredentials={
			username:"",
			password:""
		}

		self.$get = ['$http', '$q', '$log', '$localForage', function($http, $q, $log, $localForage){

			/* A common $http interface for all services pass through */
			function getPromise(method, path, payload, params, headers){

				var deferred = $q.defer();


				if(self.useJson){
					path = path+".json";
				}else{
					path = path+".xml";
				}


				$localForage.getItem('sisupport')
					.then(function(data){
						var user = data.user;
						console.clear();
						console.log("firstname::"+user.firstname);
						/* Appends the users redmine api key to new or existing headers
						 to avoid sending username/password on every call.*/
						if(!headers){
							headers = {'X-Redmine-API-Key': user.api_key}
						}else{
							headers['X-Redmine-API-Key'] = user.api_key;
						}

						var fullpath = 'http://'+ self.host +'/'+ path;

						//query string vs post with payload
						if(typeof(payload) == 'string' && method !='POST'){
							params = payload;
							data = null;
							fullpath = fullpath+params;
						}

						$http({
							method: String(method),
							url: String(fullpath),
							data: payload,
							headers: headers
						}).success(function(data, status, headers, config){
							deferred.resolve(data, status, headers, config);
						}).error(function(err){
							$log.error(err);

							deferred.reject(err);
						});

					}, function(err){
						$log.error(err);
						deferred.reject('No user logged in ');
					})


				return deferred.promise;
			}

			function redmine(){

				this.getHost = function(){
					return self.host;
				}

				this.getDefaultCredentials=function(){
					return self.defaultCredentials;
				}
				/*login uses raw $http because it requires the basic auth in
				 all other request use the 'getPromise()' method which handles passing the
				 user's api-key in all subsquent request*/
				this.login = function(username, password){

					var deferred = $q.defer();

					var path = 'users/current.json';
					var url = self.Crosshost+"http://"+username+":"+password+"@"+self.host+"/"+path;

					$http.get(url)
						.then(function(res){
							$localForage.setItem('sisupport', res.data)
								.then(function(){
									deferred.resolve(res.data);
								},function(err){
									deferred.reject(err);
								})

						}, function(err){
							console.log(err);
							deferred.reject(err);
						})

					return deferred.promise
				}

				this.logout = function(){
					var deferred = $q.defer();

					$localForage.removeItem('sisupport')
						.then(function(){
							deferred.resolve();
						},function(){
							deferred.reject('No user found');
						})

					return deferred.promise
				}


				this.wikiList = function(project){
					var path  = 'projects/'+project+'/wiki/index';
					return getPromise('GET', path);
				}

				this.wiki = function(project, title){

					var path = 'projects/'+project+'/wiki/'+title;
					return getPromise('GET', path);
				}


				this.createIssue=function (project, payload){
					var path = 'projects/'+project+'/issues';
					return getPromise('POST',path,payload);
				}

				this.getIssues=function (project,payLoad){
					var path = 'projects/'+project+'/issues';
					return getPromise('GET',path,payLoad);
				}

			}


			return new redmine()

		}]

	}
]);