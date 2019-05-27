# 👈🏻🚫 No AdBlock-Killer
[![build](https://travis-ci.org/lucasmrdt/no-adb-killer.svg?branch=master)](https://travis-ci.org/lucasmrdt/no-adb-killer)

> Have you ever had to disable adblock on a website? Thanks to **no-adblock-killer**, keep enjoying the **ad-free** website!

[![IMAGE ALT TEXT HERE](static/img/screenshot.jpg)](https://www.youtube.com/watch?time_continue=2&v=tZyNCz8wsdk)

## 🎉 Instalation Is So Easy !
[![chrome](https://avatars3.githubusercontent.com/u/1778935?s=12&v=4) **Chrome Extension**]()

## 🎛 How does it works ?
> **Adblock-killers** are located in website code source, each one use a different means to detect them.

**This extension** simply changes a small part in the source code **(1-10 chars)** where the adblock **is** detected.

---

*There is also [more options]() avaibles to disable adblock-killer.*

*See the [config.json](static/config.json) to know what's is changed on which domain.*

## ✅ Tests
```bash
npm test
```
```
🗑  Clearing
📝 Building scripts
🈺 Minifying configuration
✅ 'config.min.json' file is now minfified.
📎 Building extension
🕑 Testing


  #CONFIG
    ✓ should read config
    ✓ should have correct config file
    ✓ should get the initial script (719ms)
    ✓ should read the replaced script
    ✓ should have unique domain
    ✓ should have correct differences
    ✓ should have correct chrome pattern


  7 passing (744ms)
```

## ⌨️ Usefull Commands
|Name|Command|Description|
|:-:|:-:|:-:|
|start|`npm start`|Launch the build in watch mode. All Modifications on [src/](src/) will re-build automatically the extension.<br>**🔧 development mode**|
|build|`npm run build`|Build the project.<br>**📦 production mode**|
|config|`npm run build:config`|Build the [config.json](static/config.json). <br>**It's not an automated task, so if you edit [config.json](static/config.json) please run it.**|
|display|`npm run config:display`|Display the [config.build.json](static/config.build.json) user-friendly.|

## 👀 Quick View Of The Architecture
|Path|Description|
|:-:|:-:|
|***dist/***|📝 Where [scripts](src/scripts) are builded and ready to be run.|
|***app/***|🖥 The builded chrome extension.|
|***static/config.json***|💾 Where **actions** on each website are written. [see here](#tests)|
| ***static/config.build.json***|The builded config of [config.json](static/config.json).<br>**⛔️ Don't edit it**|

## 🌈 Contributor Friendly
### 🔄 **REPLACEMENT**
#### Replacement Configuration Template
|Key Name|Type / Value|Example|Description|
|:-:|:-:|:-:|:-:
|**action**|`"replace"`||The action of your configuration.
|**domain**|`string`|`"6play"`|The domain name of the website.
|**pattern**|`string`|`"https://www.6play.fr/player-fw-*"`|The [chrome pattern url](https://developer.chrome.com/apps/match_patterns).
|**url**|`string`|`"https://www.6play.fr/player-fw-d18b7b5d33.bundle.js"`|The URL of the adblock killer script.
|**from**|`RegExp`|`"this\\.dispatchEvent\\((\\w+)\\.EVENT_REQUEST_COMPLETE,{success:!1}\\)"`|The excaped RegExp of the instruction to be replace.
|**to**|`string`|`"this.dispatchEvent($1.EVENT_REQUEST_COMPLETE,{success:1})"`|The replaced string to disable the adblock killer.

1️⃣ **Find the file where is the written *the adblock killer*.**<br>
> I usualy use **chrome devtools/networks** and simply search for something likes **"adblock"** in javascript sources.

2️⃣ **Then find the specific "code instruction" which spoited your adblock**
> For example in *tf1.fr*, if found this line that informs the website (if `e == true`), that user has an adblock extension.
> ```javascript
> this.adblockIsActivated(function(e){if(e) //...
> ```

3️⃣ **Fix this "code instruction" to disable the *"adblock killer"***
> So I replace this regExp pattern `/this\.adblockIsActivated\(function\((\w+)\)\{if\(\w\)/` <br>
> by `'this.adblockIsActivated(function($1){if(false)'`. <br><br>
> *Note: Use the [RegExp block](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_parenthesized_substring_matches_2) to match with any variable name. Variable name can be changes during minor patch by the website own. Eg. `function(e)` can becomae `function(a)` in a different webpack build.*

4️⃣ **Try your fix**
> Update the [config.json](static/config.json).<br>
> Run the build extension `npm start`.<br>
> Finaly [load the updated extension](https://developer.chrome.com/extensions/getstarted#manifest).


## ⚠️ Any Issue ?
> Go **[HERE](https://github.com/lucasmrdt/no-adb-killer/issues)** and explain me what's wrong. 🤙🏻


## ✅ Todo
- [ ] Add Redirect and Cancel action documentation.

