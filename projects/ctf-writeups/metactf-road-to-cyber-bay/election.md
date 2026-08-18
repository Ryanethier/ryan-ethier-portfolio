# Election Fraud Detection

**Category:** Forensics / Data Analysis  
**Points:** 186  

---

## Challenge Description
We are provided with voting data from the fictional state of *Skillia*. Suspicious dropoff in votes for candidate **B** is observed only for in-person presidential votes at certain stations.

**Cheated results (after tampering):**
- President: B = 1,943,366 | A = 1,933,743 | Undervote = 60,741  

**True results (before tampering):**
- President: B = 1,918,963 | A = 1,958,146 | Undervote = 60,741  

Other races (Senate, Governor, ballot initiatives) were unaffected.

---

## Key Insight
By comparing **down-ballot consistency** (Senate/Governor) against presidential results at each station, we can detect anomalies. Significant gaps suggest tampered machines flipping votes from A → B.

---

## Solution Approach
We analyze with Python (pandas, numpy, scipy):

1. Filter for `voter_type == in_person`.  
2. For each station:
   - Compute presidential A % vs. down-ballot A %.  
   - Calculate a Z-score for the gap.  
   - Compute p-values (probability of randomness).  
3. Sort by lowest p-values → most suspicious stations.  

```python
import pandas as pd, numpy as np
from scipy.stats import norm

df = pd.read_csv("skillia_voting_records.csv")
in_person = df[df["voter_type"] == "in_person"]

def compute_stats(group):
    n = len(group)
    pres_A = (group["vote_president"] == "A").sum()
    senate_A = (group["vote_senate"] == "A").sum()
    governor_A = (group["vote_governor"] == "A").sum()
    pres_rate = pres_A / n
    downballot_rate = (senate_A + governor_A) / (2*n)
    std_err = np.sqrt(downballot_rate*(1-downballot_rate)/n)
    z = (pres_rate - downballot_rate) / std_err if std_err > 0 else 0
    p = norm.cdf(z)
    return pd.Series({"gap": downballot_rate - pres_rate, "z_score": z, "p_value": p})

results = in_person.groupby("voting_station_id").apply(compute_stats)
print(results.sort_values("p_value").head(6))
```

---

## Output
The six most suspicious stations (IDs):  
`81b7bc0c, 1251749b, 4b45c819, 1fe457e4, a4defb9c, 329071ee`

---

## Flag
`MetaCTF{redacted}`  

---

## Takeaways
- Election integrity can be audited using **statistical consistency checks**.  
- Down-ballot analysis is a powerful tool to catch anomalies.  
