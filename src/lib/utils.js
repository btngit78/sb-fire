export const ALL_KEYS = [
  { key: 0, text: "C", value: "C" },
  { key: 1, text: "C#", value: "C#" },
  { key: 2, text: "Db", value: "Db" },
  { key: 3, text: "D", value: "D" },
  { key: 4, text: "D#", value: "D#" },
  { key: 5, text: "Eb", value: "Eb" },
  { key: 6, text: "E", value: "E" },
  { key: 7, text: "F", value: "F" },
  { key: 8, text: "F#", value: "F#" },
  { key: 9, text: "Gb", value: "Gb" },
  { key: 10, text: "G", value: "G" },
  { key: 11, text: "G#", value: "G#" },
  { key: 12, text: "Ab", value: "Ab" },
  { key: 13, text: "A", value: "A" },
  { key: 14, text: "A#", value: "A#" },
  { key: 15, text: "Bb", value: "Bb" },
  { key: 16, text: "B", value: "B" },
];

export const MIN_WIDTH = 425;
export const PREF_WIDTH = 768;
export const getWidth = () => window.innerWidth;

export const chordRegExp = /\[[A-G][#b]?[+A-Za-z\d-]*(\(\d\))?(\/[A-G][#b]*)?\]/g;
export const chordRegExp1 = /\[[A-G][#b]?[+A-Za-z\d-]*(\(\d\))?(\/[A-G][#b]*)?\]/;

export function isValidKey(s) {
  if (typeof s !== "string") return false;
  if (s === "") return true; // empty key field is valid for ease of use
  const v = s.charAt(s.length - 1) === "m" ? s.substring(0, s.length - 1) : s;
  return !!(ALL_KEYS.findIndex((e) => e.value === v) >= 0);
}

export function isValidTempo(s) {
  if (typeof s === "number") return s >= 0 && s <= 500;
  if (typeof s !== "string" || !s.length) return false;
  if (!s.length) return false;
  const n = parseInt(s, 10);
  return !(isNaN(n) || n < 0 || n > 500); // arbitrary 500
}

export function isValidTitle(s) {
  return typeof s === "string" && s.length <= 80;
}

export function isValidAuthors(s) {
  return typeof s === "string" && s.length <= 80;
}

export function isValidKeywords(s) {
  return typeof s === "string" && s.length <= 80;
}

export function isValidContentLength(s) {
  return typeof s === "string" && s.length <= 4000;
}

// return null if no error, else all errors msgs
export function errorInSongFields(song) {
  let msg = "";

  if (!isValidTitle(song.title))
    msg = "Invalid song title length (maximum of 80 characters).";
  if (!isValidAuthors(song.authors))
    msg = msg.concat(
      msg.length ? "\n" : "",
      "Invalid authors length (maximum of 80 characters)."
    );
  if (!isValidKey(song.key))
    msg = msg.concat(msg.length ? "\n" : "", "Invalid key used.");
  if (!isValidKeywords(song.keywords))
    msg = msg.concat(
      msg.length ? "\n" : "",
      "Invalid keywords length (maximum of 80 characters)."
    );
  if (!isValidTempo(song.tempo))
    msg = msg.concat(
      msg.length ? "\n" : "",
      "Invalid tempo used (must be a number not greater than 500)."
    );
  if (!isValidContentLength(song.content))
    msg = msg.concat(
      msg.length ? "\n" : "",
      "Invalid content length (maximum of 4000 characters)."
    );
  return msg.length > 0 ? msg : null;
}

// find the key in the song which is passed as an array of lines
// return the key in standard notation (A-G and # or b) if found
// or null if no key was found
export function findKeyInSong(lines) {
  let index = 0;
  let chords = [];
  let lastChord = "";

  // scan backward for last chord
  for (index = lines.length - 1; index >= 0; index--) {
    chords = lines[index].match(chordRegExp);
    if (chords && chords.length > 0) {
      // console.log(chords[chords.length-1]);
      lastChord = chords[chords.length - 1].substring(
        1,
        chords[chords.length - 1].length - 1
      );
      break;
    }
  }

  if (lastChord.length) {
    if (lastChord.charAt(0).toUpperCase() > "G") {
      console.log("Invalid chord notation: " + lastChord);
      return null;
    }
    if (lastChord.length > 1) {
      let i = lastChord.indexOf("m");
      if (i > 0) return lastChord.substring(0, i + 1); // minor, may be flat or sharp
      let c = lastChord.charAt(1);
      if (c === "#" || c === "b") return lastChord.substring(0, 2); // major sharp or flat
    }
    return lastChord.slice(0, 1); // major key, not sharp nor flat
  }
  // no chord found
  return null;
}
