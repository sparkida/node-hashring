'use strict';

const assert = require('assert');
const HashRing = require('./');

it('should handle adding a node with roughly 1/n keys being missed', function () {
  this.timeout(1E6);
  const hashRing = new HashRing(3);
  const size = 1E6;
  const randomData = [...Array(size)].map(() => Math.random().toString());
  const initialLookup = Array(size);
  const secondLookup = Array(size);
  // fill the data
  for (let i = 0; i < size; i++) {
    initialLookup[i] = hashRing.findNode(randomData[i]);
  }

  const newHashRing = new HashRing(4);
  for (let i = 0; i < size; i++) {
    secondLookup[i] = newHashRing.findNode(randomData[i]);
  }

  let hits = 0;
  let misses = 0;
  for (let i = 0; i < size; i++) {
    if (initialLookup[i] !== secondLookup[i]) {
      misses++;
    } else {
      hits++;
    }
  }
  assert(1 - hits / size < 1/4);
  //console.log(`Missed: ${Number(misses / size * 100).toFixed(2)}`);
  //console.log(`Hit: ${Number(hits / size * 100).toFixed(2)}`);
});
