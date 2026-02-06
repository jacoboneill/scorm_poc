import { createContext } from "preact";
import { useContext, useState, useMemo } from "preact/hooks";
import { toChildArray } from "preact";
import { SCORM2004 } from "../scorm.js";

const ModuleContext = createContext(null);

export function useModule() {
  const ctx = useContext(ModuleContext);
  if (ctx === null) {
    throw new Error("useModule must be used within a Module");
  }
  return ctx;
}

export default function Module({ children, passRate = 100 }) {
  const slides = toChildArray(children);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizResults, setQuizResults] = useState({});
  const [mediaComplete, setMediaComplete] = useState({});

  const scorm = useMemo(() => {
    const instance = new SCORM2004(passRate);
    instance.initialize();
    return instance;
  }, []);

  const context = {
    currentSlide,
    totalSlides: slides.length,
    quizResults,
    mediaComplete,

    next: () => {
      if (currentSlide < slides.length - 1) {
        const nextSlide = currentSlide + 1;
        setCurrentSlide(nextSlide);
        scorm.setLocation(nextSlide);
      }
    },

    prev: () => {
      if (currentSlide > 0) {
        const prevSlide = currentSlide - 1;
        setCurrentSlide(prevSlide);
        scorm.setLocation(prevSlide);
      }
    },

    submitQuizAnswer: (questionId, selectedAnswer) => {
      const correct = parseInt(questionId.split("-").pop(), 10);
      setQuizResults((prev) => ({
        ...prev,
        [questionId]: { selected: selectedAnswer, correct },
      }));
    },

    markMediaComplete: (mediaId) => {
      setMediaComplete((prev) => ({ ...prev, [mediaId]: true }));
    },

    getScore: () => {
      const results = Object.values(quizResults);
      if (results.length === 0) return 0;
      const correctCount = results.filter(
        (r) => r.selected === r.correct
      ).length;
      return Math.round((correctCount / results.length) * 100);
    },

    finish: () => {
      const score = context.getScore();
      scorm.complete(score);
    },
  };

  return (
    <ModuleContext.Provider value={context}>
      {slides[currentSlide]}
    </ModuleContext.Provider>
  );
}
