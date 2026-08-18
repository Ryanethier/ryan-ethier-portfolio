# TinyPacked

**Category:** Reverse Engineering  
**Points:** 148  

---

## Challenge Description
We are given a file `challenge.mp` that uses custom compression on top of **MessagePack**. The library defines new negative extension types that standard decoders cannot parse.

---

## Key Insight
Two custom encodings are implemented:

1. **_EXT_TYPE_DICT_MAP (-2)**  
   - Stores all unique keys once.  
   - Replaces dictionary keys with integer indices.  
   - Decoding requires rebuilding the dict from index → key list.  

2. **_EXT_TYPE_CESAR_B (-4)**  
   - Delta-encoding for arrays of small integer differences.  
   - First number stored normally, subsequent values stored as deltas.  
   - Decoding requires cumulative addition.

---

## Solution
We write a custom unpacker that reverses both encodings:

```python
import tinypack

with open("challenge.mp", "rb") as f:
    packed_data = f.read()

data = tinypack.unpackb(packed_data, raw=False)
print(data)
```

Output reconstructs the original structure, revealing the flag as ASCII codes inside arrays:

```json
{
  "name": "Alice",
  "age": [77, 101, 116, 97, 67, 84, 70, 123, ... , 125],
  "city": "Wonderland",
  "hobbies": ["reading", "adventuring", [77,101,...,125], "tea parties"]
}
```

Decoding the numeric arrays yields the flag.

---

## Flag
`MetaCTF{redacted}`  

---

## Takeaways
- MessagePack extension types can be hijacked for CTF challenges.  
- Always check for **custom serialization logic** in provided libraries.  
