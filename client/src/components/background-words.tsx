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
  "What's the difference between fish collagen and bovine collagen?",
  "Is vitamin K2 necessary when taking higher doses of vitamin D?",
  "Are adaptogens safe for daily, long-term use?",
  "Does melatonin dosage vary with age for better sleep?",
  "Can alpha-lipoic acid help regulate blood sugar levels?",
  "How can I gauge the quality of my probiotic supplement?",
  "Should I combine vitamin C with iron for enhanced absorption?",
  "How do I safely transition from synthetic to natural supplements?",
  "Can supplementing with L-arginine improve workout performance?",
  "What are the potential side effects of too much vitamin A?",
  "Is there an optimal ratio of EPA to DHA in fish oil supplements?"
];

export const BackgroundWords: React.FC = () => {
  return (
    <div className="background-words-container">
      {phrases.map((phrase, index) => {
        const size = index % 3 === 0 ? 'large' : index % 3 === 1 ? 'medium' : 'small';
        const direction = index % 2 === 0 ? 'right-to-left' : 'left-to-right';
        const row = Math.floor(index / 3); // Group phrases into rows
        const stagger = (index % 3) * 2; // Stagger animations within each row

        return (
          <div
            key={index}
            className={`word-line ${size} ${direction}`}
            style={{
              animationDelay: `${stagger}s`,
              top: `${(row * 8) + (index % 2) * 4}%` // Distribute vertically with some variation
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