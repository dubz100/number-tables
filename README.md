# 🚀 Maths Rockets

A times tables game for little learners. Each table from 1 to 12 is a planet to fly to.

- **12 planets.** Pick a table and answer 10 questions to fly your rocket to that planet.
- **📖 Look before you fly.** Tapping a planet first shows the whole table. 🔊 reads it out line by line, then **🚀 Start!** begins the game.
- **📋 Peek mid-game.** Opens the table for the current question. The number of looks per game is a setting (none, 1, 2, 3, 5, 10 or unlimited; default 3).
- **🎲 Mix it up.** Random questions from every table.
- **Big answer buttons.** You pick from four choices, so there's no typing.
- **🔊 Read aloud.** Every question is spoken, so you don't need to read. After a right answer it says the whole fact ("3 times 4 is 12").
- **💡 "Show me" dots.** Shows the sum as groups of dots, e.g. 3 groups of 4. The dots also appear by themselves after two wrong tries.
- **Rewards.** Up to 3 stars per planet, 🔥 streaks, confetti and sounds. Every finished game unlocks a new space friend (36 to collect).
- **Gentle mistakes.** A wrong answer wobbles and greys out, then you try again. You can never lose.
- **⚙️ Settings.** Player name (used in praise), sounds on/off, voice on/off, questions per game, and looks at the table per game.

Progress is saved on the phone itself (in the browser's local storage). There are no accounts and no tracking.

## Put it on GitHub Pages

1. On GitHub, open the repo → **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**. Pick the branch (e.g. `main`) and the `/ (root)` folder, then click **Save**.
3. After a minute it's live at `https://<your-username>.github.io/number-tables/`.

## Install it on your phone

Open the link, then:

- **iPhone (Safari):** Share button → **Add to Home Screen**
- **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**

It then opens full screen like a normal app and works offline.

**Tip for iPhone:** if the questions aren't read aloud, check the ringer/silent switch and the volume.

## Adding plus, take away and divide later

The sums are defined in `OPS` at the top of `js/game.js`. Adding (`add`), taking away (`sub`) and dividing (`div`) are already written. They're just switched off:

```js
add: { enabled: false, ... }   // change to true
```

When more than one is switched on, a ×/+/−/÷ picker appears on the home screen. Stars are saved separately for each one.

## Files

```
index.html            screens (planets, game, results, sticker book, settings)
css/style.css         all styling
js/game.js            game logic, sounds (made in code, no audio files), voice
sw.js                 offline support
manifest.webmanifest  "Add to Home Screen" app info
icons/                app icons
```

To try it on a computer, run `python3 -m http.server` in this folder and open http://localhost:8000.
