# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: building-orbit.spec.ts >> Building orbit (Panom-style) >> go to navigates to floor page
- Location: tests\building-orbit.spec.ts:92:3

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]: VelBEE Visuals
    - generic [ref=e6]:
      - button "Exterior VT" [ref=e7] [cursor=pointer]
      - button "Unit tour (4BHK)" [ref=e8] [cursor=pointer]
      - button "Rotate left" [ref=e9] [cursor=pointer]
      - button "Rotate right" [ref=e10] [cursor=pointer]
      - button "Select floor" [ref=e11] [cursor=pointer]
    - generic "Facing north" [ref=e12]: "N"
  - generic [ref=e14]:
    - region "Building view" [ref=e15]:
      - generic [ref=e16]:
        - img "Building. Drag to rotate." [ref=e18]
        - img:
          - generic [ref=e19] [cursor=pointer]
      - generic [ref=e20]:
        - strong [ref=e21]: Ground
        - paragraph [ref=e22]: Facing north
        - button "Go to" [ref=e23] [cursor=pointer]
      - generic "Building zoom" [ref=e24]:
        - button "−" [ref=e25] [cursor=pointer]
        - generic [ref=e26]: 100%
        - button "+" [ref=e27] [cursor=pointer]
        - button "⟲" [ref=e28] [cursor=pointer]
    - complementary [ref=e29]:
      - heading "Floor" [level=1] [ref=e30]
      - paragraph [ref=e31]: Drag to rotate · Scroll to zoom the building (not the page).
      - list [ref=e32]:
        - listitem [ref=e33]:
          - button "Ground" [active] [ref=e34] [cursor=pointer]
```