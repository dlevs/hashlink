# This project is not maintained. Versions above 0.0.1 on npm may refer to a different project.

## Overview
Hashlink is a command line tool that generates symbolic links for files matching the provided pattern, using the file contents to generate hashes for the link names.

It outputs a manifest JSON which maps the original filepaths to the links. This can be used to implement file revving, so that new versions of files are always downloaded in favour of old, cached versions.

## Install
```bash
npm install -e hashlink@0.0.1
# versions above 0.0.1 may refer to a different package.
# This project is no longer published on npm or actively maintained.
```

## Usage
### Command line
Run `hashlink --help` for usage.

Running `hashlink '*.js'` will create a symbolic link of all JS files in the current directory. A map is printed to stdout - it may look like this:

```json
{
	"main.js": "main-36442f185c.js",
	"another-file.js": "another-file-44367351fa.js"
}
```

Below is a more typical use case:
```
hashlink -s --relative dist 'dist/**/*.+(js|css)' > manifest.json
```

Ensure you quote the filepath patterns, or your terminal may expand them instead of the app.

### Node
```javascript
const hashlink = require('hashlink');

hashlink({
    patterns: ['dist/**/*.+(js|css)'],
    relative: 'dist'
})
    .then((manifest) => { console.log(manifest) })
    .catch(() => { console.error('Oh no...') })
```
