# Fahm (فهم) — Project Concept

## One-line
An open-source, offline-first web app that helps a teacher or parent explain any subject to a child (or teen/adult) with pictures, words, sound and games — all driven by content packs the user controls.

## Who it is for
- **Teacher/parent (Hazem first):** builds packs, adds images and own recordings, reads with the child.
- **Child:** taps words, sees a picture and a simple explanation, plays games, practises.
- Later: teens and adults with harder topics; the community sharing packs.

## Principles
1. **Generic by design.** The app knows items, texts and games — never "Quran" or "English". Content is data.
2. **Simple for children, powerful for the teacher.** Child mode is nearly empty. Complexity lives in teacher mode.
3. **Bilingual from day one.** Arabic and English UI, RTL and LTR, pack content language independent of UI language.
4. **Local-first and private.** No account, no server, no tracking. Children's data stays on the device.
5. **Easy authoring.** Drop images in a folder named by convention, or drag them onto words, or add them while reading.
6. **Modular code.** Small files, one-way dependencies, each game a plugin.

## Core experiences
### Read With Me (first)
A short passage sits at the top (1-3 segments: verse, sentence or line). Linked words are highlighted. Tapping one shows, below: an **image box** and an **explanation box** (simple meaning + example), with a button for audio. In teacher mode, tapping an unlinked word offers "add image / explanation / recording".
Works for Quran (Arabic, RTL) and English stories (LTR) with no code change — different pack.

### Learn
Browse a pack's items as cards: image, term, meaning, audio.

### Play (MVP games)
- **Match:** drag/tap words to their pictures.
- **Quiz:** multiple choice built from any items.
- **Puzzle:** any image sliced into pieces to reassemble.
Games disable themselves when a pack lacks what they need (e.g. match needs images).

### Practice
Spaced repetition over items, per child profile.

### Teacher mode
Import packs, bind images (naming convention + drag-to-match), record audio, edit explanations, back up and restore everything. Entered by holding a button for 3 seconds.

## Audio
Teacher can record their own voice and attach it to any item as **pronunciation** or **explanation**. Voice-synthesis pronunciation comes later.

## MVP definition of done
A user can: import a pack; read a passage with tappable words; add an image and a recording to a word; play Match, Quiz and Puzzle on the same pack; practise with spaced repetition; and back up and restore everything. Works offline, in Arabic and English UI, on a tablet.

## Non-goals (for now)
Accounts, cloud sync, a backend, AI generation (parked, see ROADMAP), recitation audio, mobile store apps.
