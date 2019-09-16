/**
 * *******
 * Dialog *
 * *******
 * Developed by Eg 2019-07-23
 */
(function (factory) {
	if(typeof define === 'function' && define.amd ){
		define(function () {
			return factory();
		});
	} else {
		window['Dialog'] = factory();
	}
}(function () { 'use strict'
	var
	/*
	 * 스크립트 태그(<script></script>)만 선택하는 정규식
	 */ 
	__REGEXP_ScriptTags = /<script(\s|\S)*?\>|\<\/script(\s|\S)*?\>/g,
	/*
	 * 모든 스크립트 영역(스크립트 태그 포함)을 선택하는 정규식
	 */ 
	__REGEXP_AllScriptAreas = /<script(\s|\S)*?(\s|\S)*?<\/script(\s|\S)*?>/g,
	/*
	 * html, javascript 주석을 선택하는 정규식
	 */ 
	__REGEXP_Annotaion = /(\/\*(\s|\S)*?\*\/)|<!-{2,}(\s|\S)*?-{2,}>|^\/\/.*|(\/\/.*)/g,
	__HasProp = Object.prototype.hasOwnProperty,
	
	/*
	 * Ajax요청으로 파일을 로드할 때 로드된 문자열을 이 객체에 저장힙니다.
	 * 그 후 동일한 파일의 요청이 들어오면 Ajax요청을 다시 보내지 않고 이 객체에서 꺼내서 할당합니다.
	 * 이 객체는 hasOwnProperty만 사용하기 때문에 Object의 prototype을 상속받지 않고 __HasProp으로 대신 사용합니다.
	 */
	__Cache = Object.create(null);

	function Dialog (url) {
  	if( !(this instanceof Dialog) ){
  		throw new SyntaxError('[Dialog] "new" constructor operator is required');
  	}
  	
		this.validator(url);
		this.initProps(url);
		this.create();
		return this.callee;
	}
	
	Dialog.prototype.initProps = function (url) {
		this.url = url;
		this.loadParam = null;
		/**
		 * 호출한 Dialog객체의 load함수가 종료된 후 실행될 콜백 함수입니다.
		 */
		this.loadListener = null;
		/**
		 * 파라미터로 받은 함수의 리턴값을 loadListener의 인자로 하여 실행합니다.
		 */
		this.load = function (fn) {
			var result = fn.call(this.scope, this.loadParam);
			if( this.loadListener ){
				this.loadListener.call(this.callee, result);
			}
		}.bind(this);
		/**
		 * Dialog객체 내부의 호스트 객체에 thisBinding할 Dialog 객체
		 */
		this.dialog = {
			load: this.load
		};
		/**
		 * Dialog객체 내부의 호스트 객체에 thisBinding할 메세지 객체
		 */
		this.message = {};
		/**
		 * Dialog로 호출한 페이지와 Message.on함수의 스코프 영역으로 사용할 객체입니다.
		 */
		this.scope = {
				on: this.createOnFn(), 
				emit: this.createEmitFn()
		}
		/**
		 * Dialog 객체 생성 시 반한해줄 객체를 생성합니다.
		 */
		this.callee = {
			emit: this.createEmitFn(),
			onLoad: this.onLoad.bind(this),
			setLoadParam: this.setLoadParam.bind(this)
		};
		
		// scope객체의 property 변경이나 재할당을 하지 못하게 처리합니다.
		var descriptor = {
			configurable: false,
			enumerable: false,
			writable: false
		};
		Object.defineProperties(this.scope, { 'on': descriptor, 'emit': descriptor });
		Object.defineProperties(this.dialog, { 'load': descriptor });
	}
	
	// Dialog 객체 생성 시 필수 요소 체크
	Dialog.prototype.validator = function (url) {
		if(url == null){
			this.throwError('syntax', 'option\'s prop is required: "url"');
		}
	}
	
	/**
	 * 파일을 로드하여 Dialog 객체를 생성합니다. 
	 */
	Dialog.prototype.create = function () {
		var _this = this;
		/**
		 * url에 맞는 페이지를 호출합니다.
		 * strLoadedModule: 불러온 페이지의 문자열 
		 **/
		this.getDialog(this.url, function (strLoadedModule) {
			// 페이지 문자열에서 주석을 제거합니다.
			var 	strDOM = strLoadedModule.replace(__REGEXP_Annotaion, '');
			// 스크립트 영역을 제외하고 html 문자열만 남깁니다.
			var strHTML = strDOM.replace(__REGEXP_AllScriptAreas, '');
			// 스크립트 영역을 추출합니다. 스크립트 태그 별로 문자열의 배열로 가져옵니다.
			var strSCRIPTNodes = strDOM.match(__REGEXP_AllScriptAreas);
			
			// scope객체에 html 소스를 넣습니다.
			_this.scope.html = strHTML;
			
			// 스크립트 문자열들을 루프돌리면서 함수로 변환한 뒤 Message 객체를 스코프 영역으로 설정합니다.
			strSCRIPTNodes.forEach(function (v, i) {
				_this.makeFn(v.replace(__REGEXP_ScriptTags, ''))(_this.scope, _this.dialog);
			});
			
		});
	}
	
	/**
	 * 스크립트 문자열을 함수로 변환합니다.
	 * 이 함수는 내부 구현 특성상 메모리 누수가 일어납니다. 
	 * 최초 로딩 이후에 재로딩되는 로직은 피하는걸 권장합니다.
	 */  
	Dialog.prototype.makeFn = function (script) {
		return Function('Message', 'Dialog', script);
	}
	
	/**
	 * 각 페이지별로 message listener를 설정하는 on함수를 생성하는 함수.
	 */
	Dialog.prototype.createOnFn = function () {
		return function on (key, fn) {
			this.message[key] = fn.bind(this.scope);
		}.bind(this);
	}
	
	/**
	 * message listener를 호출하는 emit함수를 생성하는 함수. 
	 */
	Dialog.prototype.createEmitFn = function () {
		return function emit (key, param) {
			if( __HasProp.call(this.message, key) ){
				this.message[key](param);
			} else {
				this.throwError('error', 'not found message: ' + key);
			}
		}.bind(this);
	}
	
	Dialog.prototype.setLoadParam = function (param) {
		this.loadParam = param;
		return this.callee;
	}
	
	Dialog.prototype.onLoad = function (fn) {
		this.loadListener = fn;
		return this.callee;
	}

	/**
	 * 비동기 방식으로 url에 해당하는 파일을 문자열로 가져옵니다.
	 */
	Dialog.prototype.getDialog = function (url, fn) {
		/**
		 * 캐시된 페이지라면 캐시에서 꺼내옵니다.
		 */
		if( this.hasCache(url) ){
			fn(this.getCache(url));
			return;
		}
		
		var _this = this;
		var xhr = new XMLHttpRequest();
		xhr.open('get', url, true);
		xhr.onload = function (res) {
			if(res.target.status === 200){
				/**
				 * 최초 로드된 페이지라면 캐싱합니다.
				 */
				_this.setCache(url, res.target.responseText);
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
}));
