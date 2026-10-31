// Read a summary aloud — helps people who read slowly or not at all.
// Returns false if the device has no voice for the language.
export function speak(text, lang) {
  if (!("speechSynthesis" in window)) return false;
  const tag = lang === "ta" ? "ta-IN" : "en-IN";
  const voices = window.speechSynthesis.getVoices();
  if (voices.length && !voices.some((v) => (v.lang || "").toLowerCase().startsWith(tag.slice(0, 2)))) {
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = tag;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
  return true;
}
