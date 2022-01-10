'use strict';

const crypto = require('crypto');
const normalize = (number) => 360 * (number / 0xFFFFFFFF);
class HashRing {
  constructor(nodes = 2, virtualNodes = 10) {
    this.nodes = nodes;
    this.virtualNodes = virtualNodes;

    const nodeList = this.nodeList = Array(virtualNodes);
    const vnodeToNodeMap = this.vnodeToNodeMap = Object.create(null);
    const ring = this.ring = Array(nodes * virtualNodes);

    // assign node partitions along the ring
    for (let i = 0, j = 0; i < nodes; i++) {
      for (let v = 0; v < virtualNodes; v++) {
        let nodeValue = this.getHashValue(this.getHashBuffer(`${i}${v}`));
        vnodeToNodeMap[nodeValue] = i;
        ring[j] = nodeValue;
        j++;
      }
    }
    ring.sort((a, b) => a > b ? -1 : 1);
  }
    
  /**
   * Return an md5 hash digest of a string
   * @params {string}
   * @returns {Buffer}
   */
  getHashBuffer(str) {
    return crypto.createHash('md5').update(str).digest();
  }

  /**
   * Create a 32-bit unsigned integer from an md5 digest
   * @params {Buffer}
   * @returns {Integer}
   */
  getHashValue(buf) {
    return ((buf.readUInt32BE(0) << 24) | (buf.readUInt32BE(1) << 16) | (buf.readUInt32BE(2) << 8) | buf.readUInt32BE(3)) >>> 0;
  }

  /**
   * Will run through the hash ring to find a ring ID
   * that is less than the current hashed key value
   * and return the node that is assigned
   */
  findNode(key) {
    const keyHashValue = this.getHashValue(this.getHashBuffer(key));
    const { ring, vnodeToNodeMap } = this;
    for (let node of ring) {
      if (keyHashValue >= node) {
        return vnodeToNodeMap[node];
      }
    }
    return vnodeToNodeMap[ring[0]];
  }
}

module.exports = HashRing;
