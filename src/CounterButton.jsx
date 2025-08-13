// 버튼 역할을 담당하는 재사용 가능한 자식 컴포넌트
// eslint-disable-next-line react/prop-types
function CounterButton({ label, func }) {
    // 초심자를 위한 props반영 설명
    return (
        <button onClick={func}>
            {label}
        </button>
    );
}
// function CounterButton({ label, onClick }) {
//   // 보통은 이렇게 씀
//   return (
//     <button onClick={onClick}>
//       {label}
//     </button>
//   );
// }

export default CounterButton;