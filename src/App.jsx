// 단일 컴포넌트 구성
import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  // useState 훅을 가져와 초기값 0으로 설정한 다음에 구조분해할당
  // count와 setCount()로 분리함
  // console.log(useState(0));
  // console.log(count);


  return (
    <>
      <h1>초심플 카운터</h1>
      <p>{count}</p>
      {/* 선언된 변수 표현식으로 출력 */}

      <button onClick={() => setCount(count + 1)}> 증가 </button>
      <button onClick={() => setCount(count - 1)}> 감소 </button>
      {/* 자식이 부모로부터 props로 값을 전달받음 */}
      {/* 버튼을 클릭하면 부모의 setCount()실행시킴 => 해당함수가 부모의 상태값을 바꿈 */}
    </>
  );
}

export default App;