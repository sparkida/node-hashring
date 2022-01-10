'use strict';

const crypto = require('crypto');
const sortAscending = (a, b) => a > b ? -1 : 1;

/**
 * A generic consistent hashing ring with partitions
 * for more even distribution (virtual nodes) and partitions
 * for performing an initial lookup to improve performance
 */
class HashRing {
  constructor(nodes, virtualNodes = 80) {
    this.nodes = nodes;
    this.virtualNodes = virtualNodes;

    const nodeSize = this.nodeSize = nodes.length;
    const nodeList = this.nodeList = Array(virtualNodes);
    const vnodeToNodeMap = this.vnodeToNodeMap = Object.create(null);
    const ring = this.ring = Array(nodeSize * virtualNodes);

    //console.log(nodeSize);
    // create 2^4 bins that will represent all bit
    // permutations in the first four bits
    const bins = 2 ** 4;
    const binTree = this.binTree = Object.create(null);
    for (let i = 0; i < bins; i++) {
      binTree[i] = [];
    }

    // assign node partitions along the ring
    for (let i = 0, j = 0; i < nodeSize; i++) {
      let nodeId = nodes[i];
      for (let v = 0; v < virtualNodes; v++) {
        let nodeValue = this.getHashValue(this.getHashBuffer(`${nodeId}${v}`));
        //console.log(nodeValue, nodeValue & 0xF);
        binTree[nodeValue & 0xF].push(nodeValue);
        vnodeToNodeMap[nodeValue] = nodeId;
        ring[j] = nodeValue;
        j++;
      }
    }
    for (let i = 0; i < bins; i++) {
      binTree[i].sort(sortAscending);
    }
    ring.sort(sortAscending);
  }
    
  /**
   * Return a 128-bit md5 hash digest of a string
   * @params {string}
   * @returns {Buffer}
   */
  getHashBuffer(str) {
    return crypto.createHash('md5').update(str).digest();
  }

  /**
   * Create a 32-bit unsigned integer from an md5 digest.
   * This is an ideal solution for dimensiality reduction
   * whereas the search space of 2^128 is impractical.
   * @params {Buffer}
   * @returns {Integer}
   */
  getHashValue(buf) {
    return (
      (buf.readUInt32BE(0) << 24)
      | (buf.readUInt32BE(1) << 16)
      | (buf.readUInt32BE(2) << 8)
      | buf.readUInt32BE(3)
    ) >>> 0;
  }

  /**
   * Will generate a hash of the key and use the first
   * four bits as a partition key to find the associatied
   * bin. Next, it will run through the hash ring partition
   * and find the virtual node that is less than the current
   * hashed key value and return the node that is assigned
   */
  findNode(key) {
    const keyHashValue = this.getHashValue(this.getHashBuffer(key));
    const { ring, binTree, vnodeToNodeMap } = this;
    const partitionKey = keyHashValue & 0xF;
    for (let node of binTree[partitionKey]) {
      if (keyHashValue >= node) {
        return vnodeToNodeMap[node];
      }
    }
    return vnodeToNodeMap[ring[0]];
  }
}
HashRing.maxHashValue = 0xFFFFFFFF;
HashRing.prototype.nodes = [];
HashRing.prototype.nodeSize = 0;
HashRing.prototype.virtualNodes = 10;
HashRing.prototype.nodeList = [];
HashRing.prototype.vnodeToNodeMap = Object.create(null);
HashRing.prototype.ring = [];
HashRing.prototype.binTree = Object.create(null);

module.exports = HashRing;
