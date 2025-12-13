export function getHeroTypewriterAction({
  heroText,
  isDeleting,
  wordIndex,
  heroWords,
}) {
  const currentWord = heroWords[wordIndex] || "";

  // Case 1: finished typing the current word; pause before deleting
  if (!isDeleting && heroText === currentWord) {
    return { type: "pause-then-delete", delayMs: 2000 };
  }

  // Case 2: finished deleting; advance to next word and reset deleting flag
  if (isDeleting && heroText === "") {
    return {
      type: "advance-word",
      nextIsDeleting: false,
      nextWordIndex: (wordIndex + 1) % heroWords.length,
    };
  }

  // Case 3: typing forward or deleting backward
  const delayMs = isDeleting ? 50 : 100;
  const nextText = isDeleting
    ? currentWord.substring(0, Math.max(heroText.length - 1, 0))
    : currentWord.substring(0, heroText.length + 1);

  return { type: "step", nextText, delayMs };
}
