import React from 'react';

const phrases = [
  "Should I cycle L-Tyrosine?",
  "Which supplements help with muscle soreness?",
  "Is magnesium citrate different from glycinate?",
  "How can I improve my sleep?",
  "How much creatine is the right amount?",
  "Foods or supplements for vitamin D deficiency?",
  "What's a good zinc dosage for immunity?",
  "Are there benefits to ashwagandha supplements?",
  "Can fish oil help with joint health?",
  "What's the ideal B-complex ratio?"
];

export const BackgroundWords: React.FC = () => {
  return (
    <div className="background-words-container">
      {phrases.map((phrase, index) => {
        const size = index % 3 === 0 ? 'large' : index % 3 === 1 ? 'medium' : 'small';
        const direction = index % 2 === 0 ? 'right-to-left' : 'left-to-right';

        return (
          <div
            key={index}
            className={`word-line ${size} ${direction}`}
            style={{
              animationDelay: `${index * 2}s`
            }}
          >
            {phrase}
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundWords;