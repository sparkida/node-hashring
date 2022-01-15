'use strict';

const assert = require('assert');
const HashRing = require('./');

it('should handle adding a node with roughly 1/n keys being moved', function () {
  this.timeout(20000);
  const size = 1E7;
  const randomData = [...Array(size)].map(() => Math.random().toString());
  const initialLookup = Array(size);
  const secondLookup = Array(size);

  const nodeCounts = [3, 100];
  for (let i = 0; i < nodeCounts.length; i++) {
    const nodeCount = nodeCounts[i];
    const nodeList = Array(nodeCount).fill(null).map((v, i) => `localhost:1121${i}`);
    const hashRing = new HashRing(nodeList);
    for (let i = 0; i < size; i++) {
      initialLookup[i] = hashRing.findNode(randomData[i]);
    }
    hashRing.addNode('localhost:1121100-tmp');
    for (let i = 0; i < size; i++) {
      secondLookup[i] = hashRing.findNode(randomData[i]);
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
    const diffTarget = 1/(nodeCount + 1);
    const diffActual = 1 - hits/size;
    // allow a maximum % over target
    assert(diffTarget/diffActual > 0.8);
  }
});

it('should handle removing a node with roughly 1/n keys being missed', function () {
  this.timeout(20000);
  const size = 1E7;
  const randomData = [...Array(size)].map(() => Math.random().toString());
  const initialLookup = Array(size);
  const secondLookup = Array(size);

  const nodeCounts = [4, 101];
  for (let i = 0; i < nodeCounts.length; i++) {
    const nodeCount = nodeCounts[i];
    const nodeList = Array(nodeCount).fill(null).map((v, i) => `localhost:1121${i}`);
    const hashRing = new HashRing(nodeList);
    for (let i = 0; i < size; i++) {
      initialLookup[i] = hashRing.findNode(randomData[i]);
    }
    hashRing.removeNode('localhost:11210');
    for (let i = 0; i < size; i++) {
      secondLookup[i] = hashRing.findNode(randomData[i]);
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
    const diffTarget = 1/nodeCount;
    const diffActual = 1 - hits/size;
    // allow a maximum % over target
    assert(diffTarget/diffActual > 0.8);
  }
});
