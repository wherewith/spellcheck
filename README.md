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

Click on "Load unpacked"

Select the entire 'extension' directory

Navigate to https://readme.so/editor

```bash
  https://readme.so/editor
```

Activate the extension from the extensions menu in the Chrome toolbar
- Switch the toggle to 'activate' in the extension pop-up

## Test spellcheck functionality
Spell a word incorrectly in the monaco editor.

The incorrect word will highlight red

Hovering over the word will show a dropdown menu to fix the spelling error

## Test spellcheck functionality
Highlight a piece of text in the white preview area

A rewrite button will show, click the button to activate the pop-up

Click on 'Save' to rewrite the text