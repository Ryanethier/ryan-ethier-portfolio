# BitOnion

**Category:** Reverse Engineering  
**Points:** 207  

---

## Challenge Description
We are given two files: a binary called `bitonion.bin`, and a seemingly-random file called `flag_onion.txt`.

```bash
rethier@kali:~$ file *
bitonion.bin:   ELF 64-bit LSB pie executable, x86-64, dynamically linked, not stripped
flag_onion.txt: data

rethier@kali:~$ hexdump -C flag_onion.txt
00000000  85 07 16 47 65 14 35 e6  56 76 52 27 76 12 87 66  |...Ge.5.VvR'v..f|
00000010  a4 12 76 62 a4 47 a4 77  42 16 a4 97 42 e7 62 a4  |..vb.G.wB...B.b.|
...
00000830  01 06 06 01 01 18 20 02  03                       |...... ..|
00000839
```

---

## Blackbox Testing
Running the binary shows us how it is meant to be used:

```bash
rethier@kali:~$ ./bitonion.bin 
Usage: ./bitonion.bin -i infile -o outfile -c count
```

We test with some sample input:

```bash
rethier@kali:~$ echo -n 'TEST' > test.txt

rethier@kali:~$ ./bitonion.bin -i test.txt -o out.txt -c 1
Applied 01 e9

rethier@kali:~$ hexdump -C out.txt 
00000000  bd ac ba bd 01 e9                                 |......|
```

Additional runs show:

- The program prints `Applied XX XX` exactly `count` times.  
- The first byte of each operation (`00–03`) maps to a specific bitwise operation.  
- The output file grows by `count * 2` bytes.  
- The last two bytes of the output always match the printed operation and operand.  

---

## Reverse Engineering
Opening the binary in IDA Free, we see that **symbols are included**, making analysis easier. The decompiled pseudocode shows that:

1. The input file is read into memory.  
2. A loop runs `count` times, applying a random bit operation each time:
   - `0x00` → NOT  
   - `0x01` → XOR (with random key)  
   - `0x02` → ROR (rotate right, random 1–7)  
   - `0x03` → ROL (rotate left, random 1–7)  
3. After each operation, the operation ID and operand are appended to the file.  

**Key Insight:** The final two bytes of the file are not random — they record the operation and operand used. By repeatedly peeling these back in reverse, we can reconstruct the original plaintext.

---

## Solving
The solution process is straightforward:

1. Read the last two bytes (operation + operand).  
2. Undo that operation on the rest of the file.  
3. Discard those last two bytes.  
4. Repeat until the original data emerges.  

Here’s the Python implementation:

```python
# solution.py
import sys

def apply_not(buf):
    for i in range(len(buf)):
        buf[i] = (~buf[i]) & 0xFF

def apply_xor(buf, key):
    for i in range(len(buf)):
        buf[i] ^= key

def apply_rol(buf, cnt):
    for i in range(len(buf)):
        buf[i] = ((buf[i] << cnt) & 0xFF) | (buf[i] >> (8 - cnt))

def apply_ror(buf, cnt):
    for i in range(len(buf)):
        buf[i] = (buf[i] >> cnt) | ((buf[i] << (8 - cnt)) & 0xFF)

if len(sys.argv) != 2:
    print(f"Usage: {sys.argv[0]} <onion file>")
    sys.exit(0)

buf = bytearray(open(sys.argv[1], "rb").read())

while True:
    op = buf[-2]
    operand = buf[-1]
    buf = buf[:-2]

    if op == 0x00:
        apply_not(buf)
    elif op == 0x01:
        apply_xor(buf, operand)
    elif op == 0x02:
        apply_ror(buf, operand)
    elif op == 0x03:
        apply_rol(buf, operand)

    print(f"Reversed {op:02x} {operand:02x}")

    if buf[:8] == b"MetaCTF{":
        end = buf.find(b"}")
        print("Flag: " + buf[:end+1].decode())
        sys.exit(0)
```

Running this on `flag_onion.txt` produces the correct flag.

---

## Flag
`MetaCTF{redacted}`  

---

## Takeaways
- Always test binaries as a “black box” before diving into disassembly.  
- Appended metadata (like the operation/operand bytes here) can be a clue.  
- Once you recognize the reversible structure, automation with Python makes quick work of layered encodings.  
