
angular.module("dgRedmine", ['LocalForageModule']);


angular.module('dgRedmine').provider('redmine', [
	function(){

		var self = this;

		self.host = "localhost";
		self.useJson = true;
        
        //set default credentials for your redmine application
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

                function processRequest(_user){
                    /* Appends the users redmine api key to new or existing headers
                    to avoid sending username/password on every call.*/
                            if(!headers){
                                headers = {'X-Redmine-API-Key': _user.api_key}
                            }else{
                                headers['X-Redmine-API-Key'] = _user.api_key;
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
                }
                   
                //fetches user to append api-key as header for the request
				$localForage.getItem('redmineUser')
					.then(function(data){
						var user = null;
                       
                        try{
                            user = data.user
                            processRequest(user);
                        
                        }catch(err){
                            /*request failed because it tried to fetch before authorization
                            * most likely because the user navigated straight to a page oppose to hitting 
                            * the welcome site first
                            */
                            
                            var rm = new redmine;
                            $log.debug(rm.getDefaultCredentials());
                            
                            var _u = rm.getDefaultCredentials();
                            
                            rm.login(_u.username, _u.password)
                                .then(function(){
                                    $localForage.getItem('redmineUser')
                                        .then(function(newUser){
                                             processRequest(newUser);
                                        })
                                   
                                }, function(err){
                                    deferred.reject(err);
                                })
                        }
						

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
					var url = "http://"+username+":"+password+"@"+self.host+"/"+path;

					$http.get(url)
						.then(function(res){
							$localForage.setItem('redmineUser', res.data)
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

					$localForage.removeItem('redmineUser')
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