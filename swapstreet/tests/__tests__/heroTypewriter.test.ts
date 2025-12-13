import { getHeroTypewriterAction } from "@/app/lib/heroTypewriter";

describe("getHeroTypewriterAction", () => {
  it("returns pause then delete when word fully typed", () => {
    const action = getHeroTypewriterAction({
      heroText: "Hello",
      isDeleting: false,
      wordIndex: 0,
      heroWords: ["Hello", "World"],
    });

    expect(action.type).toBe("pause-then-delete");
    expect(action.delayMs).toBe(2000);
  });

  it("advances word after deletion completes", () => {
    const action = getHeroTypewriterAction({
      heroText: "",
      isDeleting: true,
      wordIndex: 0,
      heroWords: ["Hello", "World"],
    });

    expect(action.type).toBe("advance-word");
    expect(action.nextIsDeleting).toBe(false);
    expect(action.nextWordIndex).toBe(1);
  });

  it("steps typing forward with 100ms delay", () => {
    const action = getHeroTypewriterAction({
      heroText: "He",
      isDeleting: false,
      wordIndex: 0,
      heroWords: ["Hello"],
    });

    expect(action.type).toBe("step");
    expect(action.delayMs).toBe(100);
    expect(action.nextText).toBe("Hel");
  });

  it("steps deleting backward with 50ms delay", () => {
    const action = getHeroTypewriterAction({
      heroText: "Hello",
      isDeleting: true,
      wordIndex: 0,
      heroWords: ["Hello"],
    });

    expect(action.type).toBe("step");
    expect(action.delayMs).toBe(50);
    expect(action.nextText).toBe("Hell");
  });
});
