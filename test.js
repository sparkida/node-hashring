'use strict';

const assert = require('assert');
const HashRing = require('./');

it.skip('should handle adding a node with roughly 1/n keys being missed', function () {
  const hashRing = new HashRing([1,2], 10);
  console.log(hashRing.ring);
  hashRing.addNode('3');
  console.log(hashRing.ring);
  //console.log(hashRing.findNode('foo'));
});

it('should handle adding a node with roughly 1/n keys being missed', function () {
  this.timeout(1E6);
  const size = 1E7;
  const randomData = [...Array(size)].map(() => Math.random().toString());
  const initialLookup = Array(size);
  const secondLookup = Array(size);

  const nodeList1 = Array(3).fill(null).map((v, i) => `localhost:1121${i}`);
  //const nodeList2 = Array(3).fill(null).map((v, i) => `localhost:1121${i}`);
  const hashRing = new HashRing(nodeList1);
  //const newHashRing = new HashRing(nodeList2);
  let start = Date.now();
  for (let i = 0; i < size; i++) {
    initialLookup[i] = hashRing.findNode(randomData[i]);
  }
  hashRing.removeNode('localhost:11212');
  console.log(hashRing.ring);
  for (let i = 0; i < size; i++) {
    secondLookup[i] = hashRing.findNode(randomData[i]);
  }
  console.log('time: ', (Date.now() - start) / 1000);
  let hits = 0;
  let misses = 0;
  for (let i = 0; i < size; i++) {
    if (initialLookup[i] !== secondLookup[i]) {
      misses++;
    } else {
      hits++;
    }
  }
  console.log(`Missed: ${Number(misses / size * 100).toFixed(2)}`);
  console.log(`Hit: ${Number(hits / size * 100).toFixed(2)}`);
  assert(1 - hits / size < 1/4);
});
