'use strict';

const crypto = require('crypto');
const sortDescending = (a, b) => a > b ? 1 : -1;
const removeDuplicates = (val, index, arr) => arr.indexOf(val) === index; 
const murmur3 = require('./murmurhash3');

/**
 * A generic consistent hashing ring with replicas
 * for more even distribution (virtual nodes) and binary
 * searching for best performance
 */
class HashRing {
  constructor(nodes, virtualNodes = 80) {
    this.nodes = nodes.map(String).filter(removeDuplicates);
    this.nodeMap = Object.create(null);
    this.virtualNodes = virtualNodes;

    // keep a list of node names that have been added
    nodes.forEach(node => {
      this.nodeMap[node] = 1;
    });

    const nodeSize = this.nodeSize = nodes.length;
    const nodeList = this.nodeList = Array(virtualNodes);
    const vnodeToNodeMap = this.vnodeToNodeMap = Object.create(null);
    const ring = this.ring = Array(nodeSize * virtualNodes);
    const assigned = this.assigned = Object.create(null);

    // assign node partitions along the ring
    for (let i = 0, j = 0; i < nodeSize; i++) {
      let nodeId = nodes[i];
      for (let v = 0; v < virtualNodes; v++) {
        let nodeValue = this.getHashValue(`${nodeId}.${v}`);
        if (assigned[nodeValue]) {
          continue;
        }
        assigned[nodeValue] = 1;
        vnodeToNodeMap[nodeValue] = nodeId;
        ring[j] = nodeValue;
        j++;
      }
    }
    ring.sort(sortDescending);
  }
    
  /**
   * Return a 32-bit unsigned integer
   * @params {string}
   * @returns {integer}
   */
  getHashValue(str) {
    return murmur3(str, 0xFFF);
  }

  /**
   * Perform a binary search to find the ring index
   * that contains the hashed key value.
   * Thanks to @joki(https://stackoverflow.com/a/41956372/1934975)
   */
  search(key) {
    const { ring } = this;
    const size = ring.length;
    let lo = -1
    let hi = size;
    while (1 + lo < hi) {
      const mi = lo + ((hi - lo) >> 1);
      if (key < ring[mi]) {
        hi = mi;
      } else {
        lo = mi;
      }
    }
    if (hi === 0) {
      return size - 1;
    }
    return hi - 1;
  }

  /**
   * add a node to the ring
   * @params {string} nodeId
   */
  addNode(nodeId) {
    const { nodeMap, nodes, virtualNodes, assigned, vnodeToNodeMap, ring } = this;
    nodeId = String(nodeId);
    if (nodeMap[nodeId]) {
      throw new Error(`Node ${nodeId} already exists in ring`);
    }
    // add node to lists
    nodeMap[nodeId] = 1;
    nodes.push(nodeId);
    // add virtual nodes to ring
    for (let v = 0; v < virtualNodes; v++) {
      let nodeValue = this.getHashValue(`${nodeId}.${v}`);
      if (assigned[nodeValue]) {
        continue;
      }
      assigned[nodeValue] = 1;
      vnodeToNodeMap[nodeValue] = nodeId;
      if (nodeValue < ring[0]) {
        // add to start
        ring.unshift(nodeValue);
      } else if (nodeValue > ring[ring.length - 1]) {
        // add to end
        ring.push(nodeValue);
      } else {
        // find nearest neighbor
        const nearestNeighbor = this.search(nodeValue);
        ring.splice(nearestNeighbor + 1, 0, nodeValue);
      }
    }
  }

  /**
   * remove a node from the ring
   */
  removeNode(nodeId) {
    const { nodeMap, nodes, virtualNodes, assigned, vnodeToNodeMap, ring } = this;
    nodeId = String(nodeId);
    if (!nodeMap[nodeId]) {
      throw new Error(`Node ${nodeId} not found in ring.`);
    }
    // remove node from lists
    nodeMap[nodeId] = undefined;
    nodes.splice(nodes.indexOf(nodeId), 1);
    for (let v = 0; v < virtualNodes; v++) {
      let nodeValue = this.getHashValue(`${nodeId}.${v}`);
      assigned[nodeValue] = undefined;
      vnodeToNodeMap[nodeValue] = undefined;
      ring.splice(this.search(nodeValue), 1);
    }
  }

  /**
   * Will generate a hash of the key and search for
   * the closet match greater than or equal to the key
   * to find the node index in the ring. Then it will
   * use the ring node address to lookup the actual
   * node in the virtual nodes map
   */
  findNode(key) {
    const { ring, vnodeToNodeMap } = this;
    const keyHashValue = this.getHashValue(key);
    const nodeIndex = this.search(keyHashValue);
    const ringNode = ring[nodeIndex];
    return vnodeToNodeMap[ringNode];
  }
}
HashRing.maxHashValue = 0xFFFFFFFF;
HashRing.prototype.nodes = [];
HashRing.prototype.nodeSize = 0;
HashRing.prototype.virtualNodes = 80;
HashRing.prototype.nodeList = [];
HashRing.prototype.vnodeToNodeMap = Object.create(null);
HashRing.prototype.nodeMap = Object.create(null);
HashRing.prototype.ring = [];

module.exports = HashRing;
