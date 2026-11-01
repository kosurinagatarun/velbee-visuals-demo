# Panom-style building orbit — e2e mapping

| Panom behavior | Automated test |
| --- | --- |
| Building view loads | `loads homepage without content error` |
| Many orbit angles | `content has 200 building angles` |
| Drag to rotate stills | `drag orbit changes visible angle` (×3 repeat) |
| Angle settles after drag | `orbit angle stabilizes after drag release` |
| Floor bands on facade | `floor band opens selection` |
| Enter floor from building | `go to navigates to floor page` |

Not covered: pixel match to Panom CDN, night mode, live WebGL building.
