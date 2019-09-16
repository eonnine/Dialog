# Dialog  

*2019-08-30*
Promise 방식 삭제, Create, Clear, Destory 등 Hook 삭제, 코드 간소화

```javascript
/**
 Dialog로 호출한 페이지에서는 Message 객체와 Dialog 객체를 사용할 수 있습니다.
 Message 객체는 JS Object 아래와 같이 구성되어있습니다.
 
 Message = {
   on: function // 메세지 리스너 함수
   emit: function // on함수로 등록한 메세지 리스너를 실행하는 함수입니다
 }
*/


/** 
*  on 사용법
*/
Message.on('sample', function (param) {
	console.log('This is Sample Message', param);
});


/**
*  emit 사용법
*  팝업 호출 부분, Dialog 객체가 생성되며 url 경로의 파일이 로드됩니다. 스크립트도 이때 실행됩니다.
*/
var dialog = new Dialog('불러올 jsp url');

dialog.emit('sample', 'parameter'); //  console => 'This is Sample Message', 'parameter'


/**
*  Dialog 객체는 아래와 같이 구성되어 있습니다.
*  load 사용법
*/

// load할 함수 정의
Dialog.load(function (loadParam) {
	console.log(loadParam); // 'parameter'
	return 'complete'; 
});

// load 후 실행될 콜백 함수 정의
new Dialog('불러올 jsp url')
.setLoadParam('parameter')
.onLoad(function (param) {
	console.log(param); // 'complete'
});


---

***2019-07-23***  
-최초 커밋
-create, destroy, render, clear, onMessage, postMessage, dialogConstructor, renderConstructor 기능 생성

---
***2019-07-24***  
-메모리 누수 제거

---
***2019-08-30***
-Promise 방식 제거, Message 기능을 제외한 모든 기능 삭제

---  
***2019-09-16***  
-load 기능 추가.
