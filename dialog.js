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
		__allScriptAreas = /<script(\s|\S)*?(\s|\S)*?<\/script(\s|\S)*?>/g,
		__scriptTags = /<script(\s|\S)*?\>|\<\/script(\s|\S)*?\>/g,
		__annotaion = /(\/\*(\s|\S)*?\*\/)|<!-{2,}(\s|\S)*?-{2,}>|^\/\/.*|(\/\/.*)/g,
		__REGEXP_NUMBER = /[^0-9.]/g,
		__hasProp = Object.prototype.hasOwnProperty,
		__DOMParser = new DOMParser(),
		__cache = Object.create(null);
	
	/**
	 * [x] get Html, Script
	 * [x] create
	 * [x] render
	 * [x] clear
	 * [x] destroy
	 * [x] message
	 * [x] promise
	 * [x] renderConstructor
	 * [x] data caching
	 */
	function Dialog (option) {
		this.initProps();
		this.create(option);
		return this.callee;
	}
	
	Dialog.prototype.initProps = function () {
		this.isDestroy = false;
		this.id = null;
		this.url = null;
		this.html = null;
		this.scripts = [];
		this.callee = Object.create(null);
		this.scope = { self: undefined, state: {} };
		this.messageStorage = Object.create(null);
		this.message =	{ on: this.onMessage.bind(this)	};
	}
	
	Dialog.prototype.createMessage = function () {
		if( !this.isExistMessage() ){
			this.messageStorage[this.id] = Object.create(null);
		}
	}
	
	Dialog.prototype.isExistMessage = function () {
		return __hasProp.call(this.messageStorage, this.id);
	}
	
	Dialog.prototype.onMessage = function (key, fn) {
		this.createMessage();
		this.messageStorage[this.id][key] = fn;
		return this.message;
	}
	
	
	Dialog.prototype.renderComplete = function (state) {
		this.scope.state = state;
	}
	
	Dialog.prototype.renderConstructor = function (fn) {
		fn(this.renderComplete.bind(this));
	}
	
	Dialog.prototype.runConstructor = function (strDOMSCRIPT, index) {
		var isRun = false;
		try {
			var el = __DOMParser.parseFromString(strDOMSCRIPT, 'application/xml').children[0];
			if( el.hasAttribute('dialog-type') && el.getAttribute('dialog-type') === 'constructor' ){
				this.makeFn(strDOMSCRIPT.replace(__scriptTags, ''))(null, this.renderConstructor.bind(this));
				isRun = true;
			}
		} catch(e) {
			console.error(e.message);
		}
		return ( isRun ) ? index : -1;
	}
	
	Dialog.prototype.setSelfToState = function () {
		var target = document.getElementById(this.id).querySelector('[dialog-root]');
		this.scope.self = target;
	}
	
	Dialog.prototype.postMessage = function (key, message) {
		if( this.isExistMessage() && __hasProp.call(this.messageStorage[this.id], key) ){
			this.messageStorage[this.id][key].call(this.scope, message);
		}
		return this.callee;
	}
	
	Dialog.prototype.setProps = function (props) {
		for(var k in props){
			if( __hasProp.call(this, k) ){
				this[k] = props[k];
			}
		}
	}

	Dialog.prototype.create = function (option) {
		var _this = this;
		this.setProps({
			isDestroy: false,
			id: option.id,
			url: option.url,
			callee: {
				create: this.create.bind(this),
				render: this.render.bind(this),
				clear: this.clear.bind(this),
				destroy: this.destroy.bind(this),
				postMessage: this.postMessage.bind(this),
			},
		});
		Promise.then(function (resolve) {
			
			_this.getDialog(_this.url, function (strLoadedModule) {
				var 
					index = -1,
					isRunConstructor = false,
					strDOM = strLoadedModule,
					strHTML = strDOM.replace(__allScriptAreas, ''),
					strSCRIPTS = strDOM.match(__allScriptAreas).map(function (v, i) {
						if( !isRunConstructor && _this.runConstructor(v, i) === i ){
							isRunConstructor = true;
							index = i;
						}
						return v.replace(__scriptTags, '');
					});
				
				if(index !== -1){
					strSCRIPTS.splice(index, 1);
				}
				
				_this.setProps({
					html: strHTML,
					scripts: strSCRIPTS,
				});
				resolve();
			});
		});
		return _this.callee;
	}
	
	Dialog.prototype.render = function () {
		var _this = this;
		if( _this.isDestroy ){
			return;
		}
		_this.clear();
		Promise.then(function (resolve) {
			_this.renderHTML();
			_this.runScript();
			_this.setSelfToState();
			resolve();
		});
		return _this.callee;
	}
	
	Dialog.prototype.clear = function () {
		var _this = this;
		if( _this.isDestroy ){
			return;
		}
		Promise.then(function (resolve) {
			if( _this.id !== null ){
				var el = document.getElementById(_this.id);
				while ( el.firstChild ) {
					el.removeChild(el.firstChild);
				}
			}
			if( _this.isExistMessage() ){
				delete _this.messageStorage[_this.id];
			}
			_this.scope.self = undefined;
			resolve();
		});
		return _this.callee;
	};
	
	Dialog.prototype.destroy = function () {
		var _this = this;
		if( _this.isDestroy ){
			return;
		}
		_this.clear();
		Promise.then(function (resolve) {
			_this.initProps();
			_this.isDestroy = true;
			resolve();
		});
	}
	
	Dialog.prototype.renderHTML = function () {
		var el = document.getElementById(this.id);
		el.innerHTML = this.html;
	}
	
	Dialog.prototype.makeFn = function (script) {
		return Function('message', 'renderConstructor', script);
	}
	
	Dialog.prototype.runScript = function () {
		var _this = this;
		this.scripts.forEach(function (script){
			_this.makeFn(script)(_this.message);
		});
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
			_this.setCache(url, res.target.response);
			fn(res.target.response);
		}
		xhr.send();
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
	
	return Dialog;
}((function () {
	
	var Promise = function () {
		this.ing = false;
		this.queue = [];
	}
	
	Promise.prototype.then = function (fn) {
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
	
	return new Promise();
}())))));