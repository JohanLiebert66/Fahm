# Tanzil character inventory

Task 011a; analysis only. No source text, translations, or notice quotations are reproduced.
Export options (Hazem): Uthmani; pause marks and sajdah signs on; nothing else; sura|aya|text.
Normalization/tokenization: real application functions via vite-node; no replicated step table; no Vitest.
Unicode names/categories: Unicode 17.0.0 UnicodeData.txt (https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt); SHA-256 2E1EFC1DCB59C575EEDF5CCAE60F95229F706EE6D031835247D843C11D96470C. Node Unicode 17.0.
Expected verse counts: numeric sura/ayas metadata from https://tanzil.net/res/text/metadata/quran-data.xml; all 114 checked for counts, unique IDs, and consecutive ordered IDs.
Rule fingerprints: normalizeText.ts BD60AAB6BC987A15FE34A354164C9CCAFD4FA2112BB37A633BE996203615812B; spans.ts E28DD49AA535C49A1B581D4459F2711A7A4D5B3AA1803B94417BEFF2C672E5CA; tokenize.ts 203003102FB86EDF6A6AC452A2E74AD5DEF6EB4227475B3CE04428B95C2A574E.
Reproduce: node scripts/inventory-tanzil.mjs <external-source-path> [external-UnicodeData.txt-path]. Without the optional database path, the analysis CLI downloads UnicodeData once in memory; the app is not involved.
D010/D016/D020: source bytes are read-only and remain external; normalization is evaluated only for matching. This inventory does not authorize bundling or replace the pending license review.
Inventory covers only verse text fields, not numeric identifiers, delimiters, line endings, or the copyright notice. First references use source-file order.

## Whole file

### File facts
- Source SHA-256: 6933E133DD56DB778C801BF738848454E43648105A151E8D84D86A7CAE39EC5F; expected hash PASS. Source bytes: 1396087.
- Physical source-file lines: 6266; scoped verse lines: 6236; scoped suras: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114.
- Source BOM: absent; source line endings: {"CRLF":0,"LF":6266,"CR":0}; final line terminator: true.
- Scoped notice/comment lines: 28; scoped blank lines: 2; scoped unexpected non-record lines: 0.
- Source copyright notice present: true; notice/comment line numbers: 6239, 6240, 6241, 6242, 6243, 6244, 6245, 6246, 6247, 6248, 6249, 6250, 6251, 6252, 6253, 6254, 6255, 6256, 6257, 6258, 6259, 6260, 6261, 6262, 6263, 6264, 6265, 6266.
- Blank line numbers: 6237, 6238; scoped source verse line numbers: see per-sura counts below.
- Every non-record line is accounted for above; unexpected lines are represented only as line numbers and code points.
- Verse-count/identifier checks: PASS; sura 113 = 5. Text scalars: 714313; distinct scalars: 69.

| Sura | Expected verses | Actual verses | IDs/count |
| --- | --- | --- | --- |
| 1 | 7 | 7 | PASS |
| 2 | 286 | 286 | PASS |
| 3 | 200 | 200 | PASS |
| 4 | 176 | 176 | PASS |
| 5 | 120 | 120 | PASS |
| 6 | 165 | 165 | PASS |
| 7 | 206 | 206 | PASS |
| 8 | 75 | 75 | PASS |
| 9 | 129 | 129 | PASS |
| 10 | 109 | 109 | PASS |
| 11 | 123 | 123 | PASS |
| 12 | 111 | 111 | PASS |
| 13 | 43 | 43 | PASS |
| 14 | 52 | 52 | PASS |
| 15 | 99 | 99 | PASS |
| 16 | 128 | 128 | PASS |
| 17 | 111 | 111 | PASS |
| 18 | 110 | 110 | PASS |
| 19 | 98 | 98 | PASS |
| 20 | 135 | 135 | PASS |
| 21 | 112 | 112 | PASS |
| 22 | 78 | 78 | PASS |
| 23 | 118 | 118 | PASS |
| 24 | 64 | 64 | PASS |
| 25 | 77 | 77 | PASS |
| 26 | 227 | 227 | PASS |
| 27 | 93 | 93 | PASS |
| 28 | 88 | 88 | PASS |
| 29 | 69 | 69 | PASS |
| 30 | 60 | 60 | PASS |
| 31 | 34 | 34 | PASS |
| 32 | 30 | 30 | PASS |
| 33 | 73 | 73 | PASS |
| 34 | 54 | 54 | PASS |
| 35 | 45 | 45 | PASS |
| 36 | 83 | 83 | PASS |
| 37 | 182 | 182 | PASS |
| 38 | 88 | 88 | PASS |
| 39 | 75 | 75 | PASS |
| 40 | 85 | 85 | PASS |
| 41 | 54 | 54 | PASS |
| 42 | 53 | 53 | PASS |
| 43 | 89 | 89 | PASS |
| 44 | 59 | 59 | PASS |
| 45 | 37 | 37 | PASS |
| 46 | 35 | 35 | PASS |
| 47 | 38 | 38 | PASS |
| 48 | 29 | 29 | PASS |
| 49 | 18 | 18 | PASS |
| 50 | 45 | 45 | PASS |
| 51 | 60 | 60 | PASS |
| 52 | 49 | 49 | PASS |
| 53 | 62 | 62 | PASS |
| 54 | 55 | 55 | PASS |
| 55 | 78 | 78 | PASS |
| 56 | 96 | 96 | PASS |
| 57 | 29 | 29 | PASS |
| 58 | 22 | 22 | PASS |
| 59 | 24 | 24 | PASS |
| 60 | 13 | 13 | PASS |
| 61 | 14 | 14 | PASS |
| 62 | 11 | 11 | PASS |
| 63 | 11 | 11 | PASS |
| 64 | 18 | 18 | PASS |
| 65 | 12 | 12 | PASS |
| 66 | 12 | 12 | PASS |
| 67 | 30 | 30 | PASS |
| 68 | 52 | 52 | PASS |
| 69 | 52 | 52 | PASS |
| 70 | 44 | 44 | PASS |
| 71 | 28 | 28 | PASS |
| 72 | 28 | 28 | PASS |
| 73 | 20 | 20 | PASS |
| 74 | 56 | 56 | PASS |
| 75 | 40 | 40 | PASS |
| 76 | 31 | 31 | PASS |
| 77 | 50 | 50 | PASS |
| 78 | 40 | 40 | PASS |
| 79 | 46 | 46 | PASS |
| 80 | 42 | 42 | PASS |
| 81 | 29 | 29 | PASS |
| 82 | 19 | 19 | PASS |
| 83 | 36 | 36 | PASS |
| 84 | 25 | 25 | PASS |
| 85 | 22 | 22 | PASS |
| 86 | 17 | 17 | PASS |
| 87 | 19 | 19 | PASS |
| 88 | 26 | 26 | PASS |
| 89 | 30 | 30 | PASS |
| 90 | 20 | 20 | PASS |
| 91 | 15 | 15 | PASS |
| 92 | 21 | 21 | PASS |
| 93 | 11 | 11 | PASS |
| 94 | 8 | 8 | PASS |
| 95 | 8 | 8 | PASS |
| 96 | 19 | 19 | PASS |
| 97 | 5 | 5 | PASS |
| 98 | 8 | 8 | PASS |
| 99 | 8 | 8 | PASS |
| 100 | 11 | 11 | PASS |
| 101 | 11 | 11 | PASS |
| 102 | 8 | 8 | PASS |
| 103 | 3 | 3 | PASS |
| 104 | 9 | 9 | PASS |
| 105 | 5 | 5 | PASS |
| 106 | 4 | 4 | PASS |
| 107 | 7 | 7 | PASS |
| 108 | 3 | 3 | PASS |
| 109 | 6 | 6 | PASS |
| 110 | 3 | 3 | PASS |
| 111 | 5 | 5 | PASS |
| 112 | 4 | 4 | PASS |
| 113 | 5 | 5 | PASS |
| 114 | 6 | 6 | PASS |

### Code-point inventory and D034/D035 comparison
Effects below evaluate each scalar through real normalizeText; NFC is context-sensitive. Space behavior is tested between synthetic Latin letters as well as alone.
Whitespace-delimited token occurrences: 82260; occurrences where whole-token normalization differs from concatenated scalar normalization: 0. Whole-token collision analysis below uses the real function, never the scalar table.

#### Arabic letters

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |
| U+0621 | ARABIC LETTER HAMZA | Lo | 2782 | 2:6 | unchanged |
| U+0623 | ARABIC LETTER ALEF WITH HAMZA ABOVE | Lo | 8900 | 1:7 | unified -> U+0627 |
| U+0624 | ARABIC LETTER WAW WITH HAMZA ABOVE | Lo | 706 | 2:3 | unchanged |
| U+0625 | ARABIC LETTER ALEF WITH HAMZA BELOW | Lo | 5088 | 1:5 | unified -> U+0627 |
| U+0626 | ARABIC LETTER YEH WITH HAMZA ABOVE | Lo | 921 | 2:5 | unchanged |
| U+0627 | ARABIC LETTER ALEF | Lo | 25184 | 1:5 | unchanged |
| U+0628 | ARABIC LETTER BEH | Lo | 11603 | 1:1 | unchanged |
| U+0629 | ARABIC LETTER TEH MARBUTA | Lo | 2344 | 2:3 | unchanged |
| U+062A | ARABIC LETTER TEH | Lo | 10520 | 1:5 | unchanged |
| U+062B | ARABIC LETTER THEH | Lo | 1414 | 2:17 | unchanged |
| U+062C | ARABIC LETTER JEEM | Lo | 3317 | 2:16 | unchanged |
| U+062D | ARABIC LETTER HAH | Lo | 4364 | 1:1 | unchanged |
| U+062E | ARABIC LETTER KHAH | Lo | 2497 | 2:4 | unchanged |
| U+062F | ARABIC LETTER DAL | Lo | 5991 | 1:2 | unchanged |
| U+0630 | ARABIC LETTER THAL | Lo | 4932 | 1:7 | unchanged |
| U+0631 | ARABIC LETTER REH | Lo | 12627 | 1:1 | unchanged |
| U+0632 | ARABIC LETTER ZAIN | Lo | 1599 | 2:3 | unchanged |
| U+0633 | ARABIC LETTER SEEN | Lo | 6122 | 1:1 | unchanged |
| U+0634 | ARABIC LETTER SHEEN | Lo | 2124 | 2:7 | unchanged |
| U+0635 | ARABIC LETTER SAD | Lo | 2074 | 1:6 | unchanged |
| U+0636 | ARABIC LETTER DAD | Lo | 1686 | 1:7 | unchanged |
| U+0637 | ARABIC LETTER TAH | Lo | 1273 | 1:6 | unchanged |
| U+0638 | ARABIC LETTER ZAH | Lo | 853 | 2:7 | unchanged |
| U+0639 | ARABIC LETTER AIN | Lo | 9405 | 1:2 | unchanged |
| U+063A | ARABIC LETTER GHAIN | Lo | 1221 | 1:7 | unchanged |
| U+0640 | ARABIC TATWEEL | Lm | 6848 | 1:1 | stripped |
| U+0641 | ARABIC LETTER FEH | Lo | 8747 | 2:2 | unchanged |
| U+0642 | ARABIC LETTER QAF | Lo | 7034 | 1:6 | unchanged |
| U+0643 | ARABIC LETTER KAF | Lo | 10497 | 1:4 | unchanged |
| U+0644 | ARABIC LETTER LAM | Lo | 38550 | 1:1 | unchanged |
| U+0645 | ARABIC LETTER MEEM | Lo | 27071 | 1:1 | unchanged |
| U+0646 | ARABIC LETTER NOON | Lo | 27380 | 1:1 | unchanged |
| U+0647 | ARABIC LETTER HEH | Lo | 14962 | 1:1 | unchanged |
| U+0648 | ARABIC LETTER WAW | Lo | 24970 | 1:4 | unchanged |
| U+0649 | ARABIC LETTER ALEF MAKSURA | Lo | 6603 | 2:2 | unchanged |
| U+064A | ARABIC LETTER YEH | Lo | 18334 | 1:1 | unchanged |
| U+0671 | ARABIC LETTER ALEF WASLA | Lo | 13819 | 1:1 | unified -> U+0627 |
| U+06E5 | ARABIC SMALL WAW | Lm | 1257 | 2:17 | stripped |
| U+06E6 | ARABIC SMALL YEH | Lm | 957 | 2:22 | stripped |

#### Arabic marks (Mn/Me/Mc)

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |
| U+064B | ARABIC FATHATAN | Mn | 3741 | 2:2 | stripped |
| U+064C | ARABIC DAMMATAN | Mn | 2519 | 2:6 | stripped |
| U+064D | ARABIC KASRATAN | Mn | 2633 | 2:17 | stripped |
| U+064E | ARABIC FATHA | Mn | 123396 | 1:1 | stripped |
| U+064F | ARABIC DAMMA | Mn | 37320 | 1:2 | stripped |
| U+0650 | ARABIC KASRA | Mn | 46642 | 1:1 | stripped |
| U+0651 | ARABIC SHADDA | Mn | 23016 | 1:1 | stripped |
| U+0652 | ARABIC SUKUN | Mn | 37372 | 1:1 | stripped |
| U+0653 | ARABIC MADDAH ABOVE | Mn | 5376 | 1:7 | stripped |
| U+0654 | ARABIC HAMZA ABOVE | Mn | 773 | 2:4 | stripped |
| U+0670 | ARABIC LETTER SUPERSCRIPT ALEF | Mn | 9838 | 1:1 | stripped |
| U+06D6 | ARABIC SMALL HIGH LIGATURE SAD WITH LAM WITH ALEF MAKSURA | Mn | 1682 | 2:5 | stripped |
| U+06D7 | ARABIC SMALL HIGH LIGATURE QAF WITH LAM WITH ALEF MAKSURA | Mn | 603 | 2:13 | stripped |
| U+06D8 | ARABIC SMALL HIGH MEEM INITIAL FORM | Mn | 22 | 2:26 | stripped |
| U+06D9 | ARABIC SMALL HIGH LAM ALEF | Mn | 68 | 2:25 | stripped |
| U+06DA | ARABIC SMALL HIGH JEEM | Mn | 1972 | 2:19 | stripped |
| U+06DB | ARABIC SMALL HIGH THREE DOTS | Mn | 12 | 2:2 | stripped |
| U+06DC | ARABIC SMALL HIGH SEEN | Mn | 7 | 2:245 | stripped |
| U+06DF | ARABIC SMALL HIGH ROUNDED ZERO | Mn | 3988 | 2:5 | stripped |
| U+06E0 | ARABIC SMALL HIGH UPRIGHT RECTANGULAR ZERO | Mn | 66 | 2:258 | stripped |
| U+06E2 | ARABIC SMALL HIGH MEEM ISOLATED FORM | Mn | 510 | 2:10 | stripped |
| U+06E3 | ARABIC SMALL LOW SEEN | Mn | 1 | 52:37 | stripped |
| U+06E7 | ARABIC SMALL HIGH YEH | Mn | 38 | 2:61 | stripped |
| U+06E8 | ARABIC SMALL HIGH NOON | Mn | 1 | 21:88 | stripped |
| U+06EA | ARABIC EMPTY CENTRE LOW STOP | Mn | 1 | 11:41 | stripped |
| U+06EB | ARABIC EMPTY CENTRE HIGH STOP | Mn | 1 | 12:11 | stripped |
| U+06EC | ARABIC ROUNDED HIGH STOP WITH FILLED CENTRE | Mn | 1 | 41:44 | stripped |
| U+06ED | ARABIC SMALL LOW MEEM | Mn | 99 | 2:41 | stripped |

#### Format/invisible (Cf)

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |

#### Digits

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |

#### Punctuation/symbols

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |
| U+06E9 | ARABIC PLACE OF SAJDAH | So | 15 | 7:206 | stripped |

#### Spaces

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |
| U+0020 | SPACE | Zs | 76024 | 1:1 | separator: between letters -> U+002D; isolated -> (empty) |

#### Anything else

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |

Retained marks NOT stripped: none. Invisible Cf not covered by D035: none.
Letter/tatweel changes that can merge distinct spellings (matching only): U+0623 -> U+0627; U+0625 -> U+0627; U+0640 -> (empty); U+0671 -> U+0627; U+06E5 -> (empty); U+06E6 -> (empty). Diacritic removal also deliberately loses distinctions; normalized keys are not proof of word identity.
- Watch U+0610-U+061A: absent.
- Watch U+08D3-U+08FF: absent.
- Watch U+0670: U+0670 (stripped).
- Watch U+06D6-U+06ED: U+06D6 (stripped); U+06D7 (stripped); U+06D8 (stripped); U+06D9 (stripped); U+06DA (stripped); U+06DB (stripped); U+06DC (stripped); U+06DF (stripped); U+06E0 (stripped); U+06E2 (stripped); U+06E3 (stripped); U+06E5 (stripped); U+06E6 (stripped); U+06E7 (stripped); U+06E8 (stripped); U+06E9 (stripped); U+06EA (stripped); U+06EB (stripped); U+06EC (stripped); U+06ED (stripped).
- Watch U+06DD: absent.
- Watch U+06DE: absent.
- Watch U+06E9: U+06E9 (stripped).

### D036 edge/core-span risk
Actual tokenize/coreSpan offsets determine retention; no reconstructed spans. Edge runs include attached marks, standalone signs and exposed whitespace; only mark/sign/symbol/format scalars are counted. Kept attached Mn/Mc marks are intentional, not a trimming failure.
| Edge code point | Category | Kept in core | Trimmed from core | First sura:aya | Assessment |
| --- | --- | --- | --- | --- | --- |
| U+064B | Mn | 585 | 0 | 2:22 | attached mark retained as D036 requires |
| U+064C | Mn | 2516 | 0 | 2:6 | attached mark retained as D036 requires |
| U+064D | Mn | 2633 | 0 | 2:17 | attached mark retained as D036 requires |
| U+064E | Mn | 18767 | 0 | 1:2 | attached mark retained as D036 requires |
| U+064F | Mn | 8234 | 0 | 1:2 | attached mark retained as D036 requires |
| U+0650 | Mn | 9263 | 0 | 1:1 | attached mark retained as D036 requires |
| U+0651 | Mn | 3381 | 0 | 1:2 | attached mark retained as D036 requires |
| U+0652 | Mn | 8845 | 0 | 1:7 | attached mark retained as D036 requires |
| U+0653 | Mn | 2535 | 0 | 2:1 | attached mark retained as D036 requires |
| U+0670 | Mn | 1904 | 0 | 2:5 | attached mark retained as D036 requires |
| U+06D6 | Mn | 0 | 1682 | 2:5 | handled: trimmed |
| U+06D7 | Mn | 0 | 603 | 2:13 | handled: trimmed |
| U+06D8 | Mn | 0 | 22 | 2:26 | handled: trimmed |
| U+06D9 | Mn | 0 | 68 | 2:25 | handled: trimmed |
| U+06DA | Mn | 0 | 1972 | 2:19 | handled: trimmed |
| U+06DB | Mn | 0 | 12 | 2:2 | handled: trimmed |
| U+06DC | Mn | 0 | 5 | 18:1 | handled: trimmed |
| U+06DF | Mn | 3706 | 0 | 2:6 | attached mark retained as D036 requires |
| U+06E0 | Mn | 66 | 0 | 2:258 | attached mark retained as D036 requires |
| U+06E2 | Mn | 352 | 0 | 2:10 | attached mark retained as D036 requires |
| U+06E5 | Lm | 1228 | 0 | 2:17 | modifier letter retained by D036; stripped for matching |
| U+06E6 | Lm | 956 | 0 | 2:22 | modifier letter retained by D036; stripped for matching |
| U+06E9 | So | 0 | 15 | 7:206 | handled: trimmed |
| U+06ED | Mn | 99 | 0 | 2:41 | attached mark retained as D036 requires |

## Sura 113 only

### File facts
- Source SHA-256: 6933E133DD56DB778C801BF738848454E43648105A151E8D84D86A7CAE39EC5F; expected hash PASS. Source bytes: 1396087.
- Physical source-file lines: 6266; scoped verse lines: 5; scoped suras: 113.
- Source BOM: absent; source line endings: {"CRLF":0,"LF":6266,"CR":0}; final line terminator: true.
- Scoped notice/comment lines: 0; scoped blank lines: 0; scoped unexpected non-record lines: 0.
- Source copyright notice present: true; notice/comment line numbers: none in scope.
- Blank line numbers: none in scope; scoped source verse line numbers: 6226, 6227, 6228, 6229, 6230.
- Every non-record line is accounted for above; unexpected lines are represented only as line numbers and code points.
- Verse-count/identifier checks: PASS; sura 113 = 5. Text scalars: 196; distinct scalars: 34.

| Sura | Expected verses | Actual verses | IDs/count |
| --- | --- | --- | --- |
| 113 | 5 | 5 | PASS |

### Code-point inventory and D034/D035 comparison
Effects below evaluate each scalar through real normalizeText; NFC is context-sensitive. Space behavior is tested between synthetic Latin letters as well as alone.
Whitespace-delimited token occurrences: 27; occurrences where whole-token normalization differs from concatenated scalar normalization: 0. Whole-token collision analysis below uses the real function, never the scalar table.

#### Arabic letters

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |
| U+0623 | ARABIC LETTER ALEF WITH HAMZA ABOVE | Lo | 1 | 113:1 | unified -> U+0627 |
| U+0625 | ARABIC LETTER ALEF WITH HAMZA BELOW | Lo | 2 | 113:3 | unified -> U+0627 |
| U+0627 | ARABIC LETTER ALEF | Lo | 5 | 113:2 | unchanged |
| U+0628 | ARABIC LETTER BEH | Lo | 4 | 113:1 | unchanged |
| U+062A | ARABIC LETTER TEH | Lo | 1 | 113:4 | unchanged |
| U+062B | ARABIC LETTER THEH | Lo | 1 | 113:4 | unchanged |
| U+062D | ARABIC LETTER HAH | Lo | 4 | 113:1 | unchanged |
| U+062E | ARABIC LETTER KHAH | Lo | 1 | 113:2 | unchanged |
| U+062F | ARABIC LETTER DAL | Lo | 3 | 113:4 | unchanged |
| U+0630 | ARABIC LETTER THAL | Lo | 3 | 113:1 | unchanged |
| U+0631 | ARABIC LETTER REH | Lo | 7 | 113:1 | unchanged |
| U+0633 | ARABIC LETTER SEEN | Lo | 4 | 113:1 | unchanged |
| U+0634 | ARABIC LETTER SHEEN | Lo | 4 | 113:2 | unchanged |
| U+0639 | ARABIC LETTER AIN | Lo | 2 | 113:1 | unchanged |
| U+063A | ARABIC LETTER GHAIN | Lo | 1 | 113:3 | unchanged |
| U+0640 | ARABIC TATWEEL | Lm | 3 | 113:1 | stripped |
| U+0641 | ARABIC LETTER FEH | Lo | 3 | 113:1 | unchanged |
| U+0642 | ARABIC LETTER QAF | Lo | 6 | 113:1 | unchanged |
| U+0644 | ARABIC LETTER LAM | Lo | 10 | 113:1 | unchanged |
| U+0645 | ARABIC LETTER MEEM | Lo | 8 | 113:1 | unchanged |
| U+0646 | ARABIC LETTER NOON | Lo | 6 | 113:1 | unchanged |
| U+0647 | ARABIC LETTER HEH | Lo | 1 | 113:1 | unchanged |
| U+0648 | ARABIC LETTER WAW | Lo | 5 | 113:1 | unchanged |
| U+0649 | ARABIC LETTER ALEF MAKSURA | Lo | 1 | 113:4 | unchanged |
| U+064A | ARABIC LETTER YEH | Lo | 1 | 113:1 | unchanged |
| U+0671 | ARABIC LETTER ALEF WASLA | Lo | 6 | 113:1 | unified -> U+0627 |

#### Arabic marks (Mn/Me/Mc)

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |
| U+064D | ARABIC KASRATAN | Mn | 2 | 113:3 | stripped |
| U+064E | ARABIC FATHA | Mn | 33 | 113:1 | stripped |
| U+064F | ARABIC DAMMA | Mn | 4 | 113:1 | stripped |
| U+0650 | ARABIC KASRA | Mn | 24 | 113:1 | stripped |
| U+0651 | ARABIC SHADDA | Mn | 10 | 113:1 | stripped |
| U+0652 | ARABIC SUKUN | Mn | 5 | 113:1 | stripped |
| U+0670 | ARABIC LETTER SUPERSCRIPT ALEF | Mn | 3 | 113:1 | stripped |

#### Format/invisible (Cf)

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |

#### Digits

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |

#### Punctuation/symbols

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |

#### Spaces

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |
| U+0020 | SPACE | Zs | 22 | 113:1 | separator: between letters -> U+002D; isolated -> (empty) |

#### Anything else

| Code point | Unicode name | Category | Count | First sura:aya | Normalization |
| --- | --- | --- | --- | --- | --- |

Retained marks NOT stripped: none. Invisible Cf not covered by D035: none.
Letter/tatweel changes that can merge distinct spellings (matching only): U+0623 -> U+0627; U+0625 -> U+0627; U+0640 -> (empty); U+0671 -> U+0627. Diacritic removal also deliberately loses distinctions; normalized keys are not proof of word identity.
- Watch U+0610-U+061A: absent.
- Watch U+08D3-U+08FF: absent.
- Watch U+0670: U+0670 (stripped).
- Watch U+06D6-U+06ED: absent.
- Watch U+06DD: absent.
- Watch U+06DE: absent.
- Watch U+06E9: absent.

### D036 edge/core-span risk
Actual tokenize/coreSpan offsets determine retention; no reconstructed spans. Edge runs include attached marks, standalone signs and exposed whitespace; only mark/sign/symbol/format scalars are counted. Kept attached Mn/Mc marks are intentional, not a trimming failure.
| Edge code point | Category | Kept in core | Trimmed from core | First sura:aya | Assessment |
| --- | --- | --- | --- | --- | --- |
| U+064D | Mn | 2 | 0 | 113:3 | attached mark retained as D036 requires |
| U+064E | Mn | 3 | 0 | 113:2 | attached mark retained as D036 requires |
| U+064F | Mn | 1 | 0 | 113:1 | attached mark retained as D036 requires |
| U+0650 | Mn | 12 | 0 | 113:1 | attached mark retained as D036 requires |
| U+0651 | Mn | 5 | 0 | 113:1 | attached mark retained as D036 requires |
| U+0652 | Mn | 1 | 0 | 113:1 | attached mark retained as D036 requires |

## Sura 113 normalization collisions
Tokens are exact whitespace-delimited source sequences, before punctuation trimming. Distinct means different original code-point sequences; empty normalized keys are excluded as no match.
- Token occurrences: 27; distinct source tokens: 21; nonempty normalized keys: 21.
- Collision groups: 0; distinct source tokens participating: 0; excess variants: 0; participating occurrences: 0; distinct empty-normalized tokens: 0.
| Normalized code-point sequence | Original code-point sequence | Occurrences |
| --- | --- | --- |

## Recommendation
**no change needed** to normalization or core trimming for the observed corpus. No code points/ranges need adding.
Normalization: all observed marks, the sajdah symbol, tatweel and small modifier letters are already covered; there are no observed Cf characters or retained Mn/Me/Mc marks. Do not broaden U+0610-U+061A or U+08D3-U+08FF on evidence from this export: both ranges are absent and D034 explicitly preserves the former.
Core spans: observed edge pause signs U+06D6-U+06DC and the sajdah symbol U+06E9 trim correctly. Attached Mn/Mc marks remain in the core as required by D036. U+06E5/U+06E6 are Lm letters: their retention is consistent with current D036 letter handling, not an unhandled edge punctuation case; normalization already strips them. Neither occurs in sura 113. Changing that policy is not required for 011b.
Proceed to 011b pack build, subject to existing source/license and browser font-rendering prerequisites. This code-point analysis cannot prove correct visual shaping, mark placement, or font coverage; verify those in a real browser. Absence in this export does not prove support for other exports. Keep matching normalization separate from verbatim display and preserve the intentional alef/diacritic collisions.