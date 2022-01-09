'use strict';

const crypto = require('crypto');
class HashRing {
  constructor(nodes = 3, virtualNodes = 100) {
    this.nodes = nodes;
    this.virtualNodes = virtualNodes;

    const nodeList = this.nodeList = Array(virtualNodes);
    const ring = this.ring = Array(virtualNodes);
    const vnodeToNodeMap = this.vnodeToNodeMap = Object.create(null);

    // build the hash ring comprised of virtual node length
    // and distributed evenly from zero to a max 32-bit unsigned integer
    for (let i = 0, min = 0, max = 0xFFFFFFFF; i < virtualNodes; i++) {
      nodeList[i] = i % nodes;
      ring[i] = min + i * (max - min) / (virtualNodes - 1) >>> 0;
    }
    ring.pop();
    ring.reverse();

    // build a map of all virtual nodes to their node id
    nodeList.forEach((nodeId, vnodeId) => {
      const vnodeKey = ring[vnodeId];
      vnodeToNodeMap[vnodeKey] = nodeId;
    });
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
      if (keyHashValue > node) {
        return vnodeToNodeMap[node];
      }
    }
  }
}
