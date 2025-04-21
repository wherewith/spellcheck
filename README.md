# Spellcheck


## Run Locally - Frontend

Clone the project

```bash
  git clone https://github.com/wherewith/spellcheck
```

Navigate to the project directory

```bash
  cd spellcheck
```

Navigate to the server directory

```bash
  cd server
```

Build the server with make

`make`

Export environement variables
```bash
  export OPENAI_API_KEY='...'
```

Run the server

```bash
  ./spellchecker
```

Go to chrome://extensions inside Google Chrome

```bash
  chrome://extensions
```

<img src="https://raw.githubusercontent.com/wherewith/spellcheck/refs/heads/main/temp/Screenshot%202025-04-21%20at%201.20.12%20AM.png?token=GHSAT0AAAAAACF66JDCHV75UDJ5HHDPKJSY2AF6KJA" />

Click on "Load unpacked"

Select the entire 'extension' directory

<img src="https://raw.githubusercontent.com/wherewith/spellcheck/refs/heads/main/temp/Screenshot%202025-04-21%20at%201.20.38%20AM.png?token=GHSAT0AAAAAACF66JDDNTHKQKL3JACQQ5EI2AF6KYQ" />

Navigate to https://readme.so/editor

```bash
  https://readme.so/editor
```

Activate the extension from the extensions menu in the Chrome toolbar
- Switch the toggle to 'activate' in the extension pop-up

<img src="https://raw.githubusercontent.com/wherewith/spellcheck/refs/heads/main/temp/Screenshot%202025-04-21%20at%201.21.07%20AM.png?token=GHSAT0AAAAAACF66JDD7R54IKLHJW6XCWWW2AF6LHQ" />

<img src="https://raw.githubusercontent.com/wherewith/spellcheck/refs/heads/main/temp/Screenshot%202025-04-21%20at%201.21.22%20AM.png?token=GHSAT0AAAAAACF66JDDE6O2QWXUR5HA2JG62AF6LWQ" />

## Test spellcheck functionality
Spell a word incorrectly in the monaco editor.

The incorrect word will highlight red

Hovering over the word will show a dropdown menu to fix the spelling error

<img src="https://raw.githubusercontent.com/wherewith/spellcheck/refs/heads/main/temp/Screenshot%202025-04-21%20at%201.22.01%20AM.png?token=GHSAT0AAAAAACF66JDDNJKLTHCAR56JGMGY2AF6MDA" />

## Test spellcheck functionality
Highlight a piece of text in the white preview area

A rewrite button will show, click the button to activate the pop-up

Click on 'Save' to rewrite the text

<img src="https://raw.githubusercontent.com/wherewith/spellcheck/refs/heads/main/temp/Screenshot%202025-04-21%20at%201.22.20%20AM.png?token=GHSAT0AAAAAACF66JDDVZSK5I6LPRUAYPAY2AF6MMQ" />
