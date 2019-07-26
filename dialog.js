(function (factory) {
	if(typeof define === 'function' && define.amd !== undefined){
		define(function () {
			return factory;
		});
	} else {
		this['Dialog'] = factory;
	}
}((function (Promise) { 'use strict'
	
	var
		__REGEXP_allScriptAreas = /<script(\s|\S)*?(\s|\S)*?<\/script(\s|\S)*?>/g,
		__REGEXP_scriptTags = /<script(\s|\S)*?\>|\<\/script(\s|\S)*?\>/g,
		__REGEXP_annotaion = /(\/\*(\s|\S)*?\*\/)|<!-{2,}(\s|\S)*?-{2,}>|^\/\/.*|(\/\/.*)/g,
		__REGEXP_NUMBER = /[^0-9.]/g,
		__hasProp = Object.prototype.hasOwnProperty,
		__DOMParser = new DOMParser(),
		__cache = Object.create(null);
	
	function Dialog (option) {
		this.validator(option);
		this.createPromise();
		this.initProps();
		this.create(option);
		return this.focus.bind(this);
	}
	
	Dialog.prototype.initProps = function () {
		this.isDestroy = false;
		this.id = null;
		this.url = ( this.url ) ? this.url : null;
		this.html = null;
		this.scriptFns = [];
		this.ids = [];
		this.callee = {
			create: this.create.bind(this),
			render: this.render.bind(this),
			clear: this.clear.bind(this),
			postMessage: this.postMessage.bind(this),
			destroy: this.destroy.bind(this),
			focus: this.focus.bind(this),
		}
		this.scope = { parent: null, self: null, state: {} };
		this.message =	{ on: this.onMessage.bind(this)	};
		this.messageStorage = Object.create(null);
		this.renderParam = {};
		this.constructorOption = {};
		this.createHookListener = null;
		this.clearHookListener = null;
		this.destroyHookListener = null;
	}
	
	Dialog.prototype.createPromise = function () {
		this.Promise = new Promise();
	}
	
	Dialog.prototype.setProps = function (props) {
		for(var k in props){
			if( __hasProp.call(this, k) ){
				this[k] = props[k];
			}
		}
	}
	
	Dialog.prototype.validator = function (option) {
		if(option == undefined){
			this.throwError('syntax', '"option" is required ');
		}
		if(option.url == undefined){
			this.throwError('syntax', 'option\'s prop is required: "url"');
		}
		return true;
	}
	
	Dialog.prototype.setConstructor = function (strSCRIPTNodes) {
		var 
			_this=this,
			el; 
		strSCRIPTNodes.some(function (strScriptNode, i) {
			el = __DOMParser.parseFromString(strScriptNode, 'text/html').getElementsByTagName('script')[0];
			if( el.hasAttribute('dialog-type') && el.getAttribute('dialog-type') === 'constructor' ){
				_this.createHookListener = _this.makeFn(strScriptNode.replace(__REGEXP_scriptTags, ''));
				strSCRIPTNodes.splice(i, 1);
				return true;
			}
		});
	}
	
	Dialog.prototype.create = function (option) {
		this.setProps({
			isDestroy: false,
			url: ( this.url ) ? this.url : option.url,
			constructorOption: ( option != null && option.option ) ? this.copyObject(option.option) : {},
		});
		var _this = this;
		this.Promise.then('create', function (resolve) {
			_this.getDialog(_this.url, function (strLoadedModule) {
				var 
					strDOM = strLoadedModule.replace(__REGEXP_annotaion, ''),
					strHTML = strDOM.replace(__REGEXP_allScriptAreas, ''),
					strSCRIPTNodes = strDOM.match(__REGEXP_allScriptAreas),
					fnScripts;
				
				_this.setConstructor(strSCRIPTNodes);
				
				fnScripts = strSCRIPTNodes.map(function (v, i) {
					return _this.makeFn(v.replace(__REGEXP_scriptTags, ''));
				});
				
				_this.setProps({
					html: strHTML,
					scriptFns: fnScripts,
				});
				resolve();
			});
		});
		this.Promise.then('createHook', function (resolve) {
			if( this.createHookListener ){
				this.createHookListener(this.callCreateHookListener.bind(this, resolve));
			} else {
				resolve();
			}
		}.bind(this));
		return this.callee;
	}
	
	Dialog.prototype.callCreateHookListener = function (resolve, fn) {
		fn(this.setStateToScope.bind(this, resolve), this.constructorOption);
	}
	
	Dialog.prototype.render = function (param) {
		if(this.isDestroy){
			return;
		}
		var _this = this;
		_this.clear();
		this.Promise.then('render', function (resolve) {
			if( param ) {
				_this.renderParam = param;
			}
			_this.renderHTML();
			_this.setSelfToScope();
			_this.runScript();
			resolve();
		});
		return this.callee;
	}
	
	Dialog.prototype.renderHTML = function () {
		var el = document.getElementById(this.id);
		if(el == null){
			this.throwError('error', 'not found element: "' + this.id + '"');
		}
		el.innerHTML = this.html;
	}
	
	Dialog.prototype.clear = function () {
		if(this.isDestroy){
			return;
		}
		this.Promise.then('clear', function (resolve) {
			if(this.clearHookListener != null){
				this.clearHookListener.call(this.scope);
			}
			this.clearElement(resolve, [this.id]);
		}.bind(this));
		return this.callee;
	};
	
	Dialog.prototype.clearElement = function (resolve, arr) {
		var _this = this;
		var el;
		arr.forEach(function (renderId, i) {
			el = document.getElementById(renderId);
			while ( el.firstChild ) {
				el.removeChild(el.firstChild);
			}
		});
		_this.ids = arr.filter(function (el, i) {
			return _this.ids.indexOf(el) === -1;
		});
		resolve();
	};
	
	Dialog.prototype.destroy = function () {
		this.Promise.then('destroy', function (resolve) {
			if(this.destroyHookListener != null){
				this.destroyHookListener.call(this.scope);
			}
			resolve();
		}.bind(this));
		this.clear();
		this.initProps();
		this.isDestroy = true;
	}
	
	Dialog.prototype.runScript = function () {
		this.scriptFns.forEach(function (fn){
			fn(null, this.message, this.callRenderHookListener.bind(this), this.callClearHookListener.bind(this), this.callDestroyHookListener.bind(this));
		}.bind(this));
	}
	
	Dialog.prototype.callRenderHookListener = function (fn) {
		fn.call(this.scope, this.copyObject(this.renderParam));
		this.renderParam = null;
	}
	
	Dialog.prototype.callClearHookListener = function (fn) {
		this.clearHookListener = fn;
	}
	
	Dialog.prototype.callDestroyHookListener = function (fn) {
		this.destroyHookListener = fn;
	}
	
	Dialog.prototype.makeFn = function (script) {
		return Function('Dialog$Create', 'Dialog$Message', 'Dialog$Render', 'Dialog$Clear', 'Dialog$Destroy', script);
	}
	
	Dialog.prototype.getDialog = function (url, fn) {
		var _this = this;
		if( _this.hasCache(url) ){
			fn(_this.getCache(url));
			return;
		}
		var xhr = new XMLHttpRequest();
		xhr.open('get', url, true);
		xhr.onload = function (res) {
			if(res.target.status === 200){
				_this.setCache(url, res.target.responseText);
				fn(res.target.responseText);
			} else {
				_this.throwError('error', 'Invalid url: "' + url + '" [' + res.target.status + ']');
			}
		}
		xhr.send();
	}
	
	Dialog.prototype.copyObject = function (object) {
		var result = {};
		if(typeof object === 'string'){
			result = object;
		} else {
			result = {};
			for(var k in object){
				result[k] = object[k];
			}
		}
		return result;
	}
	
	Dialog.prototype.focus = function (id) {
		
		var _this = this;
		this.Promise.then('focus', function (resolve) {
			if(_this.ids.indexOf(id) === -1){
				_this.ids.push(id);
			}
			_this.id = id;
			_this.setSelfToScope();
			resolve();
		});
		return this.callee;
	}
	
	Dialog.prototype.setSelfToScope = function () {
		var parentElement = document.getElementById(this.id);
		if( parentElement == null ){
			this.throwError('error', 'not found parent element: id is "' + this.id + '"');
		}
		var self = parentElement.querySelector('[dialog-root]');
		this.scope.parent = parentElement;
		this.scope.self = self;
		this.callee.self = self;
	}
	
	Dialog.prototype.setStateToScope = function (resolve, state) {
		this.scope.state = state;
		resolve();
	}
	
	Dialog.prototype.onMessage = function (key, fn) {
		this.messageStorage[key] = fn;
	}
	
	Dialog.prototype.postMessage = function (key, message) {
		if(this.isDestroy){
			return;
		}
		this.Promise.then('postMessege', function (resolve) {
			if( this.messageStorage[key] === undefined ){
				this.throwError('error', 'not found onMessage: ' + key);
			}
			this.messageStorage[key].call(this.scope, message);
			resolve();
		}.bind(this));
		return this.callee;
	}
	
	Dialog.prototype.hasCache = function (key) {
		return __hasProp.call(__cache, key);
	}
	
	Dialog.prototype.setCache = function (key, value) {
		return __cache[key] = value;
	}
	
	Dialog.prototype.getCache = function (key) {
		return __cache[key];
	}
	
	Dialog.prototype.throwError = function (type, msg) {
		var errorMsg = '[Dialog] ' + msg; 
		switch(type){
		case 'error':
			throw new Error(errorMsg);
			break;
		case 'syntac':
			throw new SyntaxError(errorMsg);
			break;
		case 'type':
			throw new TypeError(errorMsg);
			break;
		case 'range':
			throw new RangeError(errorMsg);
			break;
		}
	}
	
	return Dialog;
}((function () {
	
	var Promise = function () {
		this.ing = false;
		this.queue = [];
	}
	
	Promise.prototype.then = function (log, fn) {
		//console.log(log);
		this.queue.push(fn);
		this.run();
	}
	
	Promise.prototype.run = function (data) {
		if( !this.ing && this.queue.length > 0 ){
			this.ing = true;
			this.queue.shift()(this.makeResolve(), data);
		}
	}
	
	Promise.prototype.makeResolve = function () {
		return function (data) {
			this.ing = false;
			this.run(data);
		}.bind(this);
	}
	
	return Promise;
}())))));