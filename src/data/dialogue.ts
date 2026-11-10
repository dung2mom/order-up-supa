import { DialogueItem } from '../types';

export const DIALOGUE_DATA: DialogueItem[] = [
  {
    id: 1,
    miaQuestion: "Hi! What can I get for you?",
    targetSentence: "Can I have a hot chocolate, please?",
    keyWords: ["have", "hot", "chocolate"],
    chunks: ["Can I have", "a hot chocolate,", "please?"],
  },
  {
    id: 2,
    miaQuestion: "What size would you like?",
    targetSentence: "A small one, please.",
    keyWords: ["small"],
    chunks: ["A small one,", "please."],
  },
  {
    id: 3,
    miaQuestion: "For here or to go?",
    targetSentence: "To go, please.",
    keyWords: ["to", "go"],
    chunks: ["To go,", "please."],
  },
  {
    id: 4,
    miaQuestion: "Anything else?",
    targetSentence: "No, thank you.",
    keyWords: ["no", "thank"],
    chunks: ["No,", "thank you."],
  },
  {
    id: 5,
    miaQuestion: "That's four dollars.",
    targetSentence: "Here you are.",
    keyWords: ["here", "you", "are"],
    chunks: ["Here", "you are."],
  },
];

// Fallback feedback templates in gentle, natural English
export const FEEDBACK_FALLBACKS = {
  success: "Perfect! I understood your order clearly.",
  smallWordMissing: (word: string) =>
    `Great, I got it! Next time, try adding "${word}" at the end to be extra polite.`,
  recast: (target: string) =>
    `Nice try! You can say: "${target}"`,
  elicitation: (hint: string, firstLetter: string) =>
    `You're almost there! "${hint}" (The missing word starts with '${firstLetter}'.)`,
  chunking: "Let's try it in small parts, one step at a time!",
  silence: "I couldn't hear you. Let's try again!",
};
