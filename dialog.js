/**
 * 사용법 :  
 */
define(function () {
	var
	__UrlPostFix = '.dtnc',
	__REGEXP_ScriptTags = /<script(\s|\S)*?\>|\<\/script(\s|\S)*?\>/g,
	__REGEXP_AllScriptAreas = /<script(\s|\S)*?(\s|\S)*?<\/script(\s|\S)*?>/g,
	__REGEXP_Annotaion = /(\/\*(\s|\S)*?\*\/)|<!-{2,}(\s|\S)*?-{2,}>|^\/\/.*|(\/\/.*)/g,
	__HasProp = Object.prototype.hasOwnProperty,
	__Cache = Object.create(null);

	function Dialog (url) {
		this.validator(url);
		this.initProps(url);
		this.create();
		return this.callee;
	}
	
	Dialog.prototype.initProps = function (url) {
		this.url = url + __UrlPostFix;
		this.message = {};
		this.scope = {
				on: this.createOnFn(), 
				emit: this.createEmitFn()
		}
		this.callee = {
			emit: this.createEmitFn()
		};
	}
	
	Dialog.prototype.validator = function (url) {
		if(url == null) this.throwError('syntax', 'option\'s prop is required: "url"');
	}
	
	Dialog.prototype.create = function () {
		var _this = this;
		this.getDialog(this.url, function (strLoadedModule) {
			var 	strDOM = strLoadedModule.replace(__REGEXP_Annotaion, '');
			var strHTML = strDOM.replace(__REGEXP_AllScriptAreas, '');
			var strSCRIPTNodes = strDOM.match(__REGEXP_AllScriptAreas);
			
			_this.scope.html = strHTML;
			strSCRIPTNodes.forEach(function (v, i) {
				_this.makeFn(v.replace(__REGEXP_ScriptTags, ''))({ on: _this.createOnFn(), emit: _this.createEmitFn() });
			});
			
		});
	}
	
	Dialog.prototype.makeFn = function (script) {
		return Function('Message', script);
	}
	
	Dialog.prototype.createOnFn = function () {
		return function on (key, fn) {
			this.message[key] = fn.bind(this.scope);
		}.bind(this);
	}
	
	Dialog.prototype.createEmitFn = function () {
		return function emit (key, param) {
			if( __HasProp.call(this.message, key) ){
				this.message[key](param);
			} else {
				this.throwError('error', 'not found message: ' + key);
			}
		}.bind(this);
	}

	Dialog.prototype.getDialog = function (url, fn) {
		if( this.hasCache(url) ){
			fn(this.getCache(url));
			return;
		}
		
		var _this = this;
		var xhr = new XMLHttpRequest();
		xhr.open('get', url, true);
		xhr.onload = function (res) {
			if(res.target.status === 200){
				//_this.setCache(url, res.target.responseText);
				fn(res.target.responseText);
			} else {
				_this.throwError('error', 'Invalid url: "' + url + '" [' + res.target.status + ']');
			}
		}
		xhr.send();
	}
	
	Dialog.prototype.throwError = function (type, msg) {
		var errorMsg = '[Dialog] ' + msg; 
		
		switch(type){
		case 'error':
			throw new Error(errorMsg);
			break;
		case 'syntax':
			throw new SyntaxError(errorMsg);
			break;
		}
	}
	
	Dialog.prototype.hasCache = function (key) {
		return __HasProp.call(__Cache, key);
	}
	
	Dialog.prototype.setCache = function (key, value) {
		return __Cache[key] = value;
	}
	
	Dialog.prototype.getCache = function (key) {
		return __Cache[key];
	}
	
	return Dialog;
});