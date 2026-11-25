import { useEffect, useRef, useState } from 'react';

function Question({ item, index, picked, onPick }) {
  const answered = picked !== null;
  return (
    <div className="quiz-item">
      <p className="quiz-q"><b>Câu {index + 1}.</b> {item.question}</p>
      <div className="quiz-options">
        {item.options.map((opt, i) => {
          const state = !answered ? '' : i === item.answer ? 'correct' : i === picked ? 'wrong' : 'dim';
          return (
            <button key={opt} type="button" className={`quiz-opt ${state}`} disabled={answered} onClick={() => onPick(i)}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className={`quiz-feedback ${picked === item.answer ? 'ok' : 'bad'}`}>
          {picked === item.answer ? '✔ Chính xác.' : '✘ Chưa đúng.'} {item.explain}
          {' '}<button type="button" className="link" onClick={() => onPick(null)}>Làm lại</button>
        </p>
      )}
    </div>
  );
}

/** onResult(correct, total) được gọi mỗi khi người học trả lời xong TẤT CẢ câu hỏi. */
export default function Quiz({ items, onResult }) {
  const [picked, setPicked] = useState(() => (items ?? []).map(() => null));
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const allAnswered = picked.length > 0 && picked.every((p) => p !== null);
  const correct = picked.filter((p, i) => p === items[i].answer).length;

  useEffect(() => {
    if (allAnswered) onResultRef.current?.(correct, picked.length);
  }, [allAnswered, correct, picked.length]);

  if (!items?.length) return <p className="muted">Bài này chưa có câu hỏi nhanh.</p>;
  return (
    <div className="quiz">
      {items.map((q, i) => (
        <Question
          key={q.question} item={q} index={i} picked={picked[i]}
          onPick={(v) => setPicked((arr) => arr.map((x, j) => (j === i ? v : x)))}
        />
      ))}
      {allAnswered && (
        <p className={`quiz-score ${correct === items.length ? 'ok' : 'bad'}`}>
          Kết quả: {correct}/{items.length} câu đúng.
          {correct === items.length ? ' Bạn đã nắm được bài này.' : ' Bấm "Làm lại" ở câu sai, đọc lại lý thuyết rồi trả lời lại.'}
        </p>
      )}
    </div>
  );
}
