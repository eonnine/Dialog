# Dialog  
jsp 모듈화 툴  

*2019-08-30*
Promise 방식 삭제, Create, Clear, Destory 등 Hook 삭제, 코드 간소화

```javascript
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<div>Content</div>

<script dialog-type="constructor">
/**
 DialogJs의 생성자 Script 부분이며 DialogJs에 의해 호출될 때 실행됩니다. 
 
 Dialog$Create 함수를 사용할 수 있습니다.
 
 ※Dialog 객체는 Promise 방식으로 동작합니다※
 ※생성자 Script가 존재한다면 Dialog$Create 함수와 Dialog$Create의 인자로 전달되는 setStateResolve 함수는 반드시 실행되어야 합니다※
 
 위 함수를 이용해서 하단의 메인 script 부분에서 사용할 수 있는 공용 데이터를 세팅할 수 있습니다.
 Dialog$Create함수의 파라미터로 콜백함수를 넘겨주면 해당 콜백함수에 두 가지 인자가 전달됩니다.
 
 첫 번째 인자로 setStateResolve 함수가 전달됩니다.
 setStateResolve 함수에 공용 데이터를 파라미터로 넘겨주면 그 데이터는 메인 script에서 접근할 수 있습니다.
 
 두 번쨰 인자는 DialogJs를 이용해 호출할 때 임의로 넘겨주는 Option 파라미터입니다.
 
 아래는 예시입니다.
 공통 콤보박스를 구성할 때 사용한 코드입니다.
*/

// Combo Dialog 호출 부분, Dialog 객체가 생성되며 url 경로의 파일에 생성자 Script가 정의되어 있다면 실행됩니다.
var NotCommonCombo = new Dialog({
	url: '/components/form/Combo',
	option: {
		commonCombo: false 
	} 
});

 
// Combo Dialog 생성자 Script 부분
// 생성자를 정의할 때는 Dialog$Create의 setStateResolve 함수가 반드시 호출되어야 합니다.
Dialog$Create(function (setStateResolve, option) {
	if( option.commonCombo !== false ){
		Util.ajaxJsonParam('/scm/getCommonCode.dtnc', null, null, function (response) {

			// 공용 데이터를 세팅, 생성자 Script 실행 완료
			setStateResolve({ 
				comboDataObject: response.data.reduce(groupByReducer, {}),
				loadedCombo: {},
			});
		});
	} else {

		// 공용 데이터를 세팅, 생성자 Script 실행 완료
		setStateResolve({
			comboDataObject: {},
			loadedCombo: {},
		});
	}
});

function groupByReducer (acc, crrObj) {
	if( !acc.hasOwnProperty(crrObj.hirCd) ){
		acc[crrObj.hirCd] = [];
	}
	acc[crrObj.hirCd].push({
		key: crrObj.key,
		value: crrObj.value
	});
	return acc;
}
</script>
<script>
/**
메인 script 영역입니다.

Dialog$Render, Dialog$Clear, Dialog$Destroy 함수가 제공되며
각 Dialog 객체의 render, clear, destroy 함수들이 실행될 때 호출될 콜백 함수들을 정의할 수 있습니다.

아래는 예시입니다.
*/

// 콤보박스 render 훅 정의 부분
Dialog$Render(function (props) {
	console.log('Call combo render!');
	console.log(props.type);
	console.log(props.code);
	console.log(this.self);
	console.log(this.state);
});

// Dialog 객체의 render 함수 실행 부분
var Combo = new Dialog({ url: '/components/form/Combo' });
Combo('콤보박스를 세팅할 SelectBox의 Id').render({ type: 'common', code: 'P01' }); 
/** [console]
	Call combo render!
	common
	P01
	Combo가 세팅된 Element (= document.getElementById('콤보박스를 세팅할 SelectBox의 Id') )
	{ comboDataObject: {...}, 	loadedCombo: {...} } (= 생성자에서 setStateResolve 함수로 정의한 공용 데이터 )
*/
	
</script>
```

---


***2019-07-23***  
-최초 커밋
-create, destroy, render, clear, onMessage, postMessage, dialogConstructor, renderConstructor 기능 생성

---
***2019-07-24***  
-메모리 누수 제거
