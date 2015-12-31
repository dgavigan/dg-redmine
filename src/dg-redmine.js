
angular.module("dgRedmine", ['LocalForageModule']);


angular.module('dgRedmine').provider('redmine', [
	function(){

		var self = this;

		self.host = "localhost";
		self.useJson = true;

		self.$get = ['$http', '$q', '$log', '$localForage', function($http, $q, $log, $localForage){

			/* A common $http interface for all services pass through */
	        function getPromise(method, path, data, params, headers){

	            var deferred = $q.defer();

	            var _url = self.host;

	            if(self.useJson){
	            	path = path+".json";
	            }else{
	            	path = path+".xml";
	            }


	           	/* Appends the users redmine api key to new or existing headers
	           	to avoid sending username/password on every call. 
	           	if(!headers){
                    headers = {'X-Redmine-API-Key': currentUser.tenantId}
                }else{
                    headers['X-Redmine-API-Key'] = currentUser.tenantId;    
                }*/
	            

	           	var fullpath = 'http://'+ _url +'/'+ path;

	            //query string vs post with payload
	            if(typeof(data) == 'string' && method !='POST'){
	                params = data;
	                data = null;
	                fullpath = fullpath+params;
	            }
	                $http({
	                    method: String(method),
	                    url: String(fullpath),
	                    data: data,
	                    headers: headers
	                }).success(function(data, status, headers, config){
	                    deferred.resolve(data, status, headers, config);
	                }).error(function(err){
	                    $log.error(err);
	               
	                    deferred.reject(err);
	                });

	            return deferred.promise;
	        }



			function redmine(){
	
				this.getHost = function(){
					return self.host;
				}

				/*login uses raw $http because it requires the basic auth in
				all other request use the 'getPromise()' method which handles passing the
				user's api-key in all subsquent request*/
				this.login = function(username, password){

					var deferred = $q.defer();

					var path = 'users/current.json';
					var url = "http://"+username+":"+password+"@"+self.host+"/"+path;

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


				this.wikiList = function(project){
					var path  = 'projects/'+project+'/wiki/index';
					return getPromise('GET', path);
				}

				this.wiki = function(project, title){

					var path = 'projects/'+project+'/wiki/'+title;
					return getPromise('GET', path);
				}




			}


			return new redmine()

		}]

	}
]);