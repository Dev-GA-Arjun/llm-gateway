### Baseline: Concurrency 1 vs 5

| Metric             |         C1 |         C5 |
| ------------------ | ---------: | ---------: |
| Requests completed |         15 |         70 |
| Requests/sec       |       0.50 |       2.34 |
| Avg latency        | 2014.14 ms | 2015.99 ms |
| p50                |    2014 ms |    2013 ms |
| p90                |    2019 ms |    2023 ms |
| Errors             |          0 |          0 |
| Timeouts           |          0 |          0 |

**Observation:** Increasing concurrency from 1 to 5 increased throughput by approximately 4.68×, while latency remained approximately 2 seconds. No errors or timeouts occurred.

**Interpretation:** The gateway successfully handles overlapping upstream requests. No noticeable latency degradation was observed at concurrency 5 during this test.

**Limitation:** Each test lasted approximately 30 seconds and was conducted on a local machine using a mock upstream.
