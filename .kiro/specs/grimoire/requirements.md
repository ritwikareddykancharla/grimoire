# Requirements: Grimoire '95

## Introduction
Grimoire '95 is a web app that brings back the 1990s multimedia CD-ROM encyclopedia experience on top of live Wikipedia data. It offers a home screen of daily content, a clean article reader with a media gallery, a kid-friendly reading level, and Mind Manor, a haunted-house trivia game generated from real history.

## Requirement 1: Home screen
**User story:** As a curious reader, I want a home screen with something interesting every day, so that I have a reason to start exploring.

### Acceptance criteria
1. WHEN the home screen loads THEN the system SHALL show today's featured article, the picture of the day and up to 6 "on this day" events from Wikipedia's featured feed.
2. WHEN an "on this day" event has a related article THEN the system SHALL link to it inside the app.
3. IF the featured feed cannot be loaded THEN the system SHALL show a friendly error with a retry button and keep search usable.
4. The home screen SHALL offer entry points to Mind Manor and to a sample article.

## Requirement 2: Search
**User story:** As a reader, I want suggestions while I type, so that I can find an article quickly.

### Acceptance criteria
1. WHEN the user types in the search box THEN the system SHALL show up to 8 title suggestions with thumbnails and descriptions, debounced by 200 ms.
2. WHEN the user presses Arrow Up/Down THEN the system SHALL move the active suggestion; Enter SHALL open the active (or first) suggestion.
3. WHEN no suggestion exists and the user presses Enter THEN the system SHALL try to open an article with the typed title.
4. The search box SHALL follow the ARIA combobox pattern.
5. WHEN the user presses Random THEN the system SHALL open a random article in the current reading level.

## Requirement 3: Article reader
**User story:** As a reader, I want articles to look like a clean encyclopedia page, so that I can focus on reading.

### Acceptance criteria
1. WHEN an article opens THEN the system SHALL show its title, short description, lead image, a table of contents built from its sections, and the article body.
2. The system SHALL remove references, citation markers, navigation boxes, maintenance banners, edit links and reference-only sections from the body.
3. WHEN the body contains a link to another article THEN the system SHALL turn it into an in-app link; links to non-article pages and external sites SHALL open in a new tab.
4. The system SHALL sanitize all article HTML so that no script, event handler, form, iframe or non-http(s) URL can reach the page.
5. WHEN an article has images THEN the system SHALL show up to 12 in a media gallery; selecting one SHALL open a larger view with its caption.
6. Every article view SHALL credit Wikipedia, link to the original article and name the CC BY-SA 4.0 license.
7. IF the article does not exist THEN the system SHALL say so and suggest searching.

## Requirement 4: Reading level
**User story:** As a parent or teacher, I want a simpler reading level, so that younger readers can understand articles.

### Acceptance criteria
1. The system SHALL offer a Simple / Full toggle that switches between Simple English Wikipedia and English Wikipedia.
2. The system SHALL remember the chosen level across visits on the same device.
3. IF an article has no Simple English version THEN the system SHALL explain this and offer the full article in one click.

## Requirement 5: Mind Manor game
**User story:** As a kid, I want a spooky quiz game built from real history, so that learning feels like an adventure.

### Acceptance criteria
1. The manor SHALL have 8 rooms from the Foyer to the Attic; the player starts in the Foyer with 3 lanterns.
2. WHEN the player answers a riddle correctly THEN the system SHALL move them to the next room and add one to their score.
3. WHEN the player answers incorrectly THEN the system SHALL put out one lantern and reveal the right answer.
4. WHEN the player reaches the Attic THEN the system SHALL declare a win; WHEN the last lantern goes out THEN it SHALL declare a loss. No further answers SHALL change the outcome.
5. The system SHALL generate enough riddles from today's "on this day" events to finish any game (7 rooms to climb + 2 affordable mistakes = 9 riddles).
6. Each riddle SHALL have exactly 4 distinct options with exactly one correct answer.
7. "What year?" riddles SHALL use plausible decoy years, never year 0 and never a future year, and the clue SHALL NOT contain the answer year.
8. "Which article?" riddles SHALL NOT reveal the article title (or its significant words) in the clue or hint.
9. WHEN a riddle is answered THEN the system SHALL offer a "Learn more" link to the article behind it.
10. Riddle generation SHALL be deterministic for a given seed, and each new game SHALL use a new seed.

## Requirement 6: Look, feel and accessibility
**User story:** As any user, I want the app to feel like a polished 90s CD-ROM with a Halloween twist, and to work with keyboard and assistive tech.

### Acceptance criteria
1. The UI SHALL use 95-era window chrome (title bar, beveled buttons, status bar) with the Halloween palette described in `product.md`.
2. All interactive elements SHALL be reachable and usable by keyboard with a visible focus indicator.
3. WHEN the user prefers reduced motion THEN the system SHALL disable all animations.
4. The layout SHALL work on screens down to 360 px wide.

## Requirement 7: Zero-friction deployment
**User story:** As a judge, I want to open a URL and use the app with no setup.

### Acceptance criteria
1. The app SHALL run as static files with no backend, account or API key.
2. The app SHALL work from any base path (hash routing, relative asset URLs).
3. A GitHub Actions workflow SHALL test, build and publish the app to GitHub Pages on every push to `main`.
