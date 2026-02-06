import { useState } from "preact/hooks";
import { useModule } from "./Module.jsx";
import Button from "./Button.jsx";

export default function Quiz({ questions }) {
  const { submitQuizAnswer, quizResults } = useModule();

  // Quiz manages its own UI state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);

  const entries = Object.entries(questions);
  const total = entries.length;
  const [questionText, questionData] = entries[currentQ];
  const questionId = `q-${currentQ}-${questionData.correct}`;

  // Check if this question was already submitted
  const result = quizResults[questionId];
  const isSubmitted = result !== undefined;

  const handleSelect = (idx) => {
    if (!isSubmitted) {
      setSelected(idx);
    }
  };

  const handleSubmit = () => {
    if (selected !== null) {
      submitQuizAnswer(questionId, selected);
    }
  };

  const handleNext = () => {
    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null); // Reset selection for next question
    }
  };

  const getAnswerClass = (idx) => {
    const classes = ["quiz-answer"];
    if (isSubmitted) {
      if (idx === questionData.correct) classes.push("correct");
      else if (idx === result.selected) classes.push("incorrect");
      else classes.push("disabled");
    } else if (idx === selected) {
      classes.push("selected");
    }
    return classes.join(" ");
  };

  return (
    <div class="quiz-container">
      <div class="quiz-progress">
        Question {currentQ + 1} of {total}
      </div>
      <h2 class="quiz-question">{questionText}</h2>
      <div class="quiz-options">
        {questionData.options.map((option, idx) => (
          <button
            key={idx}
            class={getAnswerClass(idx)}
            onClick={() => handleSelect(idx)}
            disabled={isSubmitted}
          >
            <span class="quiz-answer-letter">
              {String.fromCharCode(65 + idx)}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <div class="quiz-actions">
        {!isSubmitted && selected !== null && (
          <Button onClick={handleSubmit}>Submit</Button>
        )}
        {isSubmitted && currentQ < total - 1 && (
          <Button onClick={handleNext}>Next Question</Button>
        )}
      </div>
    </div>
  );
}
