# tl – free translator for the terminal

Translate text right from your console. No account, no API key, no dependencies – just Node.js.

```text
> tl "ich mag Äpfel"
I like apples

> tl --config english german
Switched: English -> German

> tl "Good morning"
Guten Morgen
```

## Features

- **One short command:** `tl <text>` translates in your configured direction (default German → English)
- **Persistent direction:** `tl --config english german` switches it until you change it again
- **Smart reverse:** if the text is already in the target language, it is translated back automatically
- **24+ languages** by English or German name (`spanish`, `spanisch`) or code (`es`)
- **Clipboard, pipes and interactive mode** (`-c`, `cat file | tl`, `tl`)
- **Free:** uses a public Google Translate endpoint and falls back to [MyMemory](https://mymemory.translated.net/) if Google is unavailable
- **Works everywhere:** PowerShell 7, Windows PowerShell, Developer PowerShell, cmd, bash, zsh – Windows, macOS and Linux

## Requirements

- [Node.js](https://nodejs.org/) **18 or newer** (includes `npm`)

Check with:

```bash
node --version
```

## Installation

### Option 1: install directly from GitHub (recommended)

```bash
npm install -g github:SfmBastianBichler/tl-translate
```

### Option 2: clone and install

```bash
git clone https://github.com/SfmBastianBichler/tl-translate.git
cd tl-translate
npm install -g .
```

### Option 3: download the ZIP (no git)

1. On GitHub, click **Code → Download ZIP** and extract it.
2. Open a terminal in the extracted folder and run:

```bash
npm install -g .
```

After installing, **open a new terminal** and test it:

```bash
tl --help
```

> **Windows – "running scripts is disabled on this system"?**
> npm creates a small PowerShell wrapper for `tl`. If PowerShell blocks it, allow local scripts for your user once:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```
>
> Alternatively, `tl` always works in `cmd`.

## Usage

| Command | What it does |
|---|---|
| `tl ich mag Äpfel` | Translate in the configured direction (quotes are optional) |
| `tl --config english german` | Change the direction permanently |
| `tl --config` | Show the current direction |
| `tl -t french Hello` | One-off translation into another language |
| `tl -s en -t de "Good night"` | Fix source and target language |
| `tl -c Hallo` | Also copy the result to the clipboard |
| `tl -v Hallo` | Show the detected direction, e.g. `[de → en] Hello` |
| `Get-Content file.txt \| tl` | Translate text from a pipe (`cat file.txt \| tl` on bash) |
| `tl` | Interactive mode – one translation per line, empty line quits |
| `tl --help` | Full overview with all languages |

### Interactive mode

Run `tl` without arguments and type line by line:

| Command | What it does |
|---|---|
| `:to <language>` | Change target language |
| `:from <language>` | Fix source language |
| `:auto` | Back to the configured direction |
| `:copy` | Toggle clipboard copy |

### Supported languages

German (`de`), English (`en`), French (`fr`), Spanish (`es`), Italian (`it`), Portuguese (`pt`), Dutch (`nl`), Polish (`pl`), Russian (`ru`), Turkish (`tr`), Ukrainian (`uk`), Czech (`cs`), Swedish (`sv`), Danish (`da`), Norwegian (`no`), Finnish (`fi`), Greek (`el`), Croatian (`hr`), Hungarian (`hu`), Romanian (`ro`), Arabic (`ar`), Chinese (`zh-CN`), Japanese (`ja`), Korean (`ko`).

Any other [Google language code](https://cloud.google.com/translate/docs/languages) works too, e.g. `tl -t vi Hello`.

## Configuration

The direction is stored in `~/.tl.json` (on Windows `C:\Users\<you>\.tl.json`):

```json
{
  "from": "de",
  "to": "en"
}
```

## Update

Run the same install command again:

```bash
npm install -g github:SfmBastianBichler/tl-translate
```

## Uninstall

```bash
npm uninstall -g tl-translate
```

Optionally delete the settings file `~/.tl.json`.

## How it works

`tl` is a single Node.js script ([`bin/tl.mjs`](bin/tl.mjs)) without dependencies. It calls the public Google Translate endpoint used by the Chrome dictionary extension. If that request fails, it falls back to the free MyMemory API (about 5,000 characters per day without an account).

Both services are unofficial or rate-limited free tiers, so they are fine for everyday use but not meant for bulk translation.

## License

[MIT](LICENSE)
