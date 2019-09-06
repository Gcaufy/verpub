## About


A light weight package release tool.


## Install && Usage

1. Run in command line
```
$ npm install verpub -g # global install verpub
$ verpub publish
```


## How it works

1. If this project do not contain subPackage, then skip this step. Otherwise it will allow you to select a specific package to publish.
2. Select a release tag and release version.
3. Check if your git work tree is not clean, then process end.
4. Write version to your package.
5. Run git commit && git tag && git push(include tags).
6. Run npm publish


## API

```
const VerPub = require('verpub');

const verpub = new VerPub(options);

verpub.publish();
```


