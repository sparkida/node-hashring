NodeJS Hash Ring
----------------

A consistent hash ring with partitions for more even distribution (virtual nodes) and partitions for performing an initial lookup to improve performance.

The initial lookup is further optimized to **O(1)** by reading from a bin sort, using the first four bits from the hashed value as a lookup key to minimize the otherwise best case **O(n)** performance on large arrays.
