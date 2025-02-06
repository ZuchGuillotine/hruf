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
  "What's the ideal B-complex ratio?",
  "Do I need to add copper if I'm taking zinc?",
  "Can N-Acetyl Cysteine cause drowsiness?",
  "What supplements are good for improved VO2 max?",
  "How much is too much vitamin A?",
  "Which amino acids help with hormone therapy?",
  "Convert the recommended dose for someone my weight",
  "Is turmeric really effective for reducing inflammation?",
  "Is there a recommended collagen supplement for stronger joints?",
  "Could NAC (N-Acetyl Cysteine) improve liver function?",
  "Are herbal supplements helpful for managing stress levels?",
  "What's the safest way to boost vitamin B12 intake?",
  "Does CoQ10 play a key role in supporting heart health?"
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
          >
            {phrase}
          </div>
        );
      })}
    </div>
  );
};

export default BackgroundWords;