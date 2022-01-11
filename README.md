NodeJS HashRing
----------------

A consistent hashing ring with replicas for more even distribution (virtual nodes) and binary searching for best performance.

This hashring uses the [MurmurHash algorithm](http://en.wikipedia.org/wiki/MurmurHash) which creates a 32-bit integer as opposed to using something like a 128-bit MD5. Which means, in comparison to an MD5 based hashring, this offers a lot more performance.

Usage
-----

### Install from npm
```bash
npm install node-hashing
// or
yarn add node-hashring
```

### Create a hashring

This will create a hashring for two primary nodes,
by default each node will be comprised of 80 virtual nodes.
```js
const HashRing = require('node-hashring');
const hashRing = new HashRing([
  'server-address-1',
  'server-address-2',
]);
```

### Get node from key

```js
const serverAddress = hashRing.findNode('my-key');
```

### Add a node

```js
hashRing.addNode('server-address-2');
```

### Remove a node

```js
hashRing.removeNode('server-address-2');
```
