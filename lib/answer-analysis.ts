// Server-side analysis of a completed answer: did the bot actually answer,
// and which regulation sections did it cite? Used by analytics logging only —
// never blocks or alters the response sent to the user.

// The system prompt tells the model to decline questions it can't answer from
// the provided documents; these patterns match that refusal language.
const FALLBACK_PATTERNS: RegExp[] = [
  /\bonly answer questions about\b/i,
  /\b(?:cannot|can't|unable to)\s+(?:answer|find|locate|provide)\b/i,
  /\bi\s+(?:don't|do not)\s+(?:have|find|see)\b/i,
  /\b(?:doesn't|does not|don't|do not)\s+(?:contain|address|cover|include|specify|mention|appear)\b/i,
  /\bno\s+(?:specific\s+)?information\s+(?:about|on|regarding|available)\b/i,
  /\bnot\s+(?:covered|addressed|specified|mentioned|included)\s+in\s+the\b/i,
  /\b(?:outside|beyond)\s+the\s+scope\b/i,
  /\bcould(?:n't| not)\s+find\b/i,
]

const MAX_CITATIONS = 15

// "606 CMR 7.04" / "102 CMR 1.07", with optional subsection dropped so
// counts aggregate at the section level admins actually think in.
const CMR_RE = /\b(606|102)\s*CMR\s*(\d{1,2})\.(\d{1,2})\b/gi
// "Section 7.04" / "§ 10.05" without the CMR prefix; the chapter number
// identifies which CMR it belongs to.
const SECTION_RE = /(?:\bsection|§)\s*(\d{1,2})\.(\d{1,2})\b/gi
const CHAPTER_TO_CMR: Record<string, string> = { '7': '606', '10': '606', '14': '606', '1': '102' }

export function extractCitedSections(answer: string): string[] {
  const found = new Set<string>()

  for (const m of answer.matchAll(CMR_RE)) {
    found.add(`${m[1]} CMR ${m[2]}.${m[3]}`)
  }
  for (const m of answer.matchAll(SECTION_RE)) {
    const cmr = CHAPTER_TO_CMR[m[1]]
    if (cmr) found.add(`${cmr} CMR ${m[1]}.${m[2]}`)
  }

  return [...found].slice(0, MAX_CITATIONS)
}

// A refusal phrase alone isn't conclusive — substantive answers sometimes note
// that one detail is unspecified while still citing the relevant sections.
export function isFallbackAnswer(answer: string, citedSections: string[]): boolean {
  const text = answer.trim()
  if (text.length < 40) return true
  if (!FALLBACK_PATTERNS.some((re) => re.test(text))) return false
  // Refusal language + no citations = the bot had nothing to offer
  if (citedSections.length === 0) return true
  // Cited but still brief — likely "see section X, but I can't answer this"
  return text.length < 300
}
