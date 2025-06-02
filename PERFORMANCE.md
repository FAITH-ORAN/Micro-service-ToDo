# Performance Measurements

- Make sure that your app is running

## Performance Measurements with K6

. To run the tests

- cd tests
  k6 run load.test.js

### Baseline (no index, no gzip)

– p95: 4.83s

![alt text](<Baseline (no index, no gzip).png>)

### After SQLite index

– p95: 30.76ms

![alt text](<After SQLite index.png>)

### After gzip compression

– p95: 22.34ms

![alt text](<After gzip compression.png>)

### After index + gzip

– p95: 3.58s

![alt text](<After index + gzip.png>)
