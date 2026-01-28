import { useState } from "preact/hooks";
import { useModule } from "./Module";
import Button from "./Button";

export default function Quiz({ questions, graded, passRate }) {
  const { selectAnswer, submitAnswer, quizAnswers, quizSubmitted } =
    useModule();
  const [currentQ, setCurrentQ] = useState(0);

  const entries = Object.entries(questions);
  const total = entries.length;
  const [questionText, questionData] = entries[currentQ];
  const questionId = `q-${currentQ}-${questionData.correct}`;
  const selected = quizAnswers[questionId];
  const submitted = quizSubmitted[questionId];

  const handleNext = () => {
    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const getAnswerClass = (idx) => {
    const classes = ["quiz-answer"];
    if (submitted) {
      if (idx === questionData.correct) classes.push("correct");
      else if (idx === selected) classes.push("incorrect");
      else classes.push("disabled");
    } else if (idx === selected) {
      classes.push("selected");
    }
    return classes.join(" ");
  };

  return (
    <div class="flex flex-col gap-6 w-full max-w-xl">
      <div class="text-sm text-white/60 uppercase tracking-wider">
        Question {currentQ + 1} of {total}
      </div>
      <h2 class="text-2xl font-bold text-white">{questionText}</h2>
      <div class="flex flex-col gap-3">
        {questionData.options.map((option, idx) => (
          <button
            key={idx}
            class={getAnswerClass(idx)}
            onClick={() => selectAnswer(questionId, idx)}
            disabled={submitted}
          >
            <span class="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-sm font-bold shrink-0">
              {String.fromCharCode(65 + idx)}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <div class="flex gap-4 justify-end mt-2">
        {!submitted && selected !== undefined && (
          <Button onClick={() => submitAnswer(questionId)}>Submit</Button>
        )}
        {submitted && currentQ < total - 1 && (
          <Button onClick={handleNext}>Next Question</Button>
        )}
      </div>
    </div>
  );
}
