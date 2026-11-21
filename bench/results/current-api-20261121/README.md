# Current workspace API comparison

Apple M2; darwin arm64; Node v24.22.2; V8 13.6.233.17-node.63.

Measured from 2026-11-21T12:57:36.849Z through 2026-11-21T13:07:13.319Z.

The default ESM entry is included in every comparison. These measurements describe this local workspace and host; they are not a cross-platform result or a complete Astro build speedup. Source and built-artifact SHA-256 hashes in the JSON identify the measured code. No release or source commit is inferred from the package version.

Fresh processes, rotated implementation order, at least 100 ms warmup and 10,000 short calls or 1,000 long calls, then at least 300 ms per case. Every measured call includes Buffer.byteLength of the result. Imports and Wasm initialization are excluded. Values below are medians of process means, with minimum and maximum in parentheses; ranges are not confidence intervals.

## HTML escaping and competitors

Installed competitor versions: escape-html 1.0.3, fast-escape-html 1.1.0, html-escaper 3.0.3.

The HTML suite retains the historical 25 inputs. Text and attribute suites add quotes-only, CR/LF, and mixed context inputs across the 16/128/256-unit boundaries. They compare the three escapex entries using the same operation. Competitors without these context APIs are excluded rather than measured with different output rules.

## escapeHTML

5 fresh processes per implementation. Raw data: [escapeHTML.json](./escapeHTML.json).

| Case | UTF-16 units (min to max) | Pool | esm | native | escape-html | fast-escape-html | html-escaper |
|---|---:|---:|---:|---:|---:|---:|---:|
| short | 16 to 16 | 1 | 144.0 (138.7 to 185.9) | 142.8 (139.7 to 202.6) | 168.7 (168.0 to 173.4) | 165.0 (163.8 to 168.4) | 235.3 (233.5 to 240.0) |
| unchanged-16 | 16 to 16 | 1 | 39.2 (38.3 to 40.2) | 39.8 (39.2 to 60.1) | 44.9 (44.4 to 47.3) | 40.4 (39.8 to 44.8) | 65.1 (64.7 to 66.9) |
| first-16 | 16 to 16 | 1 | 106.5 (103.9 to 108.7) | 106.3 (103.3 to 120.4) | 123.5 (118.5 to 130.2) | 115.2 (113.4 to 116.8) | 128.6 (127.5 to 130.9) |
| first-31 | 31 to 31 | 1 | 122.9 (121.1 to 124.2) | 124.0 (121.3 to 133.7) | 176.9 (172.7 to 182.6) | 165.4 (164.9 to 166.2) | 138.9 (138.3 to 142.8) |
| first-32 | 32 to 32 | 1 | 124.8 (124.1 to 125.6) | 124.8 (123.3 to 128.1) | 177.1 (173.4 to 188.4) | 168.5 (167.3 to 172.2) | 141.3 (140.6 to 147.3) |
| dense-31 | 31 to 31 | 1 | 348.3 (346.9 to 350.6) | 349.8 (349.3 to 354.5) | 379.8 (376.7 to 397.6) | 375.5 (372.7 to 383.1) | 939.6 (927.6 to 958.2) |
| unchanged-short | 37 to 37 | 1 | 53.5 (53.1 to 55.5) | 53.8 (53.6 to 54.8) | 59.2 (58.5 to 62.5) | 54.5 (54.3 to 58.7) | 82.5 (82.2 to 84.8) |
| unchanged-long | 155648 to 155648 | 1 | 93987.3 (91456.3 to 100024.6) | 28906.8 (28640.8 to 29183.8) | 93981.4 (93764.6 to 98505.7) | 93947.8 (93277.3 to 95506.4) | 94062.4 (93894.8 to 96743.2) |
| quoted-json | 33171 to 33171 | 1 | 188245.9 (186294.3 to 188643.0) | 63824.6 (63375.4 to 64964.5) | 197986.4 (196547.9 to 207354.0) | 183400.2 (182418.3 to 189456.4) | 417982.8 (414732.5 to 427605.1) |
| japanese-emoji | 44032 to 44032 | 1 | 420719.0 (417301.9 to 422882.0) | 122896.6 (122224.8 to 126361.8) | 442254.3 (440709.7 to 457950.3) | 661993.0 (660484.6 to 691481.2) | 456655.7 (454468.8 to 464840.8) |
| long-body | 349440 to 349440 | 1 | 291769.0 (281874.8 to 318853.7) | 289248.8 (287130.9 to 298042.9) | 779866.7 (776513.6 to 802526.6) | 2746589.4 (2737398.1 to 2895881.0) | 290927.0 (289452.4 to 297885.0) |
| dense-quotes | 28672 to 28672 | 1 | 259853.0 (258000.2 to 265891.6) | 77132.3 (76499.3 to 78528.6) | 253691.2 (251987.3 to 257836.7) | 392973.7 (390439.7 to 411288.4) | 642895.7 (642534.0 to 656725.4) |
| first-24 | 24 to 24 | 1 | 128.2 (127.1 to 130.5) | 122.4 (120.6 to 124.6) | 162.7 (158.1 to 164.1) | 263.3 (259.0 to 266.2) | 134.7 (134.1 to 140.5) |
| last-31 | 31 to 31 | 1 | 92.9 (91.5 to 93.1) | 87.6 (86.5 to 88.5) | 111.1 (108.6 to 142.5) | 118.1 (114.0 to 119.7) | 142.5 (142.4 to 149.1) |
| two-near-31 | 31 to 31 | 1 | 144.1 (139.6 to 144.7) | 137.2 (136.3 to 139.2) | 190.0 (183.6 to 192.3) | 313.8 (309.5 to 317.1) | 172.6 (171.9 to 178.7) |
| two-far-31 | 31 to 31 | 1 | 146.2 (146.0 to 147.9) | 139.9 (139.3 to 141.1) | 188.4 (187.6 to 196.1) | 315.8 (304.4 to 320.9) | 169.8 (169.2 to 182.2) |
| dense-32 | 32 to 32 | 1 | 349.3 (347.3 to 353.1) | 353.6 (351.4 to 354.0) | 366.4 (361.4 to 376.0) | 490.8 (484.6 to 503.0) | 945.7 (934.5 to 990.6) |
| dense-255 | 255 to 255 | 1 | 2453.3 (2432.9 to 2464.6) | 1483.6 (1448.6 to 1508.6) | 2435.3 (2410.6 to 2477.7) | 3390.4 (3359.2 to 3541.4) | 6762.0 (6692.9 to 6904.8) |
| first-255 | 255 to 255 | 1 | 240.1 (238.4 to 240.7) | 241.9 (239.1 to 245.8) | 750.4 (744.9 to 762.8) | 1772.5 (1766.8 to 1864.0) | 267.8 (265.6 to 282.0) |
| first-256 | 256 to 256 | 1 | 233.8 (231.1 to 236.9) | 244.3 (239.8 to 248.3) | 749.2 (748.0 to 768.9) | 1781.3 (1768.0 to 1830.7) | 268.0 (266.0 to 272.5) |
| spaced-8 | 1024 to 1024 | 1 | 4397.4 (4355.1 to 4398.7) | 1795.4 (1773.7 to 2298.4) | 5032.3 (4990.0 to 5120.9) | 9518.9 (9412.4 to 9781.2) | 5186.5 (5131.3 to 5321.1) |
| spaced-32 | 1024 to 1024 | 1 | 1622.0 (1606.2 to 1628.2) | 1628.8 (1622.7 to 1731.4) | 3348.3 (3320.4 to 3413.7) | 7110.4 (7059.1 to 7302.3) | 1773.4 (1747.4 to 2091.2) |
| sparse-8192 | 8192 to 8192 | 1 | 4023.1 (3958.0 to 4043.0) | 4033.7 (4009.0 to 4250.6) | 21067.5 (20904.2 to 21428.2) | 52858.7 (52680.5 to 54103.6) | 4092.2 (4038.9 to 4788.7) |
| mixed-short | 7 to 255 | 36 | 301.4 (298.0 to 303.3) | 256.7 (253.1 to 267.8) | 352.4 (349.6 to 402.8) | 478.0 (472.6 to 482.8) | 420.1 (415.6 to 645.6) |
| mixed-long | 256 to 16384 | 24 | 13455.5 (13327.5 to 13501.8) | 6852.8 (6821.2 to 6938.8) | 18499.2 (18439.5 to 18936.6) | 36459.8 (36426.8 to 36583.2) | 35365.9 (35129.6 to 53035.1) |

Times are nanoseconds per call.

## escapeText

3 fresh processes per implementation. Raw data: [escapeText.json](./escapeText.json).

| Case | UTF-16 units (min to max) | Pool | esm | wasm | native |
|---|---:|---:|---:|---:|---:|
| short | 16 to 16 | 1 | 146.8 (142.9 to 155.3) | 272.0 (271.5 to 274.7) | 143.9 (141.6 to 145.3) |
| unchanged-16 | 16 to 16 | 1 | 33.6 (33.6 to 37.5) | 35.3 (35.0 to 43.3) | 34.8 (34.2 to 35.7) |
| first-16 | 16 to 16 | 1 | 99.0 (96.7 to 107.2) | 260.1 (258.2 to 265.4) | 99.5 (98.0 to 108.3) |
| first-31 | 31 to 31 | 1 | 106.4 (106.3 to 110.8) | 311.7 (308.8 to 314.7) | 105.9 (104.1 to 106.3) |
| first-32 | 32 to 32 | 1 | 106.8 (105.8 to 112.8) | 315.8 (315.4 to 320.4) | 105.0 (104.1 to 108.9) |
| dense-31 | 31 to 31 | 1 | 708.4 (706.4 to 714.0) | 612.8 (609.3 to 615.2) | 716.6 (710.2 to 721.0) |
| unchanged-short | 37 to 37 | 1 | 39.9 (39.9 to 43.3) | 41.3 (41.1 to 48.1) | 40.6 (39.7 to 40.8) |
| unchanged-long | 155648 to 155648 | 1 | 28853.2 (28801.2 to 28868.7) | 28779.5 (28771.0 to 28781.0) | 28757.7 (28652.6 to 28883.1) |
| quoted-json | 33171 to 33171 | 1 | 76095.4 (75954.2 to 76152.5) | 122156.5 (122054.2 to 122161.7) | 30060.4 (29867.9 to 30274.9) |
| japanese-emoji | 44032 to 44032 | 1 | 326248.8 (325472.4 to 327965.9) | 328296.1 (328200.8 to 328321.0) | 91925.7 (91312.8 to 92044.9) |
| long-body | 349440 to 349440 | 1 | 133264.7 (131942.1 to 133816.4) | 1070885.7 (1068181.9 to 1073890.5) | 233318.6 (231648.1 to 233328.8) |
| dense-quotes | 28672 to 28672 | 1 | 331472.3 (331443.3 to 332481.8) | 240349.2 (240273.7 to 240386.8) | 50368.3 (50227.1 to 50602.5) |
| first-24 | 24 to 24 | 1 | 100.8 (97.7 to 107.7) | 300.4 (299.8 to 306.7) | 102.9 (102.0 to 104.3) |
| last-31 | 31 to 31 | 1 | 98.5 (97.7 to 106.5) | 315.7 (314.1 to 318.7) | 99.6 (99.5 to 100.4) |
| two-near-31 | 31 to 31 | 1 | 128.6 (126.2 to 135.9) | 330.5 (328.7 to 331.6) | 129.8 (129.6 to 134.3) |
| two-far-31 | 31 to 31 | 1 | 126.2 (126.2 to 131.5) | 333.9 (332.4 to 337.3) | 128.7 (128.7 to 130.4) |
| dense-32 | 32 to 32 | 1 | 712.1 (710.8 to 716.6) | 631.6 (631.6 to 635.6) | 729.8 (727.7 to 735.2) |
| dense-255 | 255 to 255 | 1 | 5110.0 (5109.8 to 5115.3) | 3734.9 (3734.4 to 3771.6) | 5214.5 (5205.4 to 5241.4) |
| first-255 | 255 to 255 | 1 | 149.3 (146.3 to 154.7) | 1007.2 (1007.1 to 1013.0) | 154.4 (152.2 to 155.3) |
| first-256 | 256 to 256 | 1 | 156.7 (151.8 to 158.1) | 1005.4 (1000.0 to 1010.5) | 456.5 (453.6 to 474.2) |
| spaced-8 | 1024 to 1024 | 1 | 4624.2 (4614.4 to 4635.7) | 6070.0 (6064.3 to 6076.2) | 1550.9 (1538.9 to 1551.9) |
| spaced-32 | 1024 to 1024 | 1 | 1328.1 (1325.7 to 1334.9) | 4037.8 (4034.9 to 4038.3) | 1108.6 (1108.4 to 1120.2) |
| sparse-8192 | 8192 to 8192 | 1 | 1853.0 (1852.8 to 1873.6) | 24145.3 (24122.2 to 24161.3) | 5219.3 (5211.6 to 5226.2) |
| mixed-short | 7 to 255 | 36 | 293.5 (293.3 to 297.8) | 431.2 (426.6 to 431.4) | 309.1 (308.9 to 310.7) |
| mixed-long | 256 to 16384 | 24 | 24524.2 (24439.4 to 24649.2) | 27308.2 (27247.3 to 27318.1) | 6608.3 (6593.5 to 6618.5) |
| quotes-only | 256 to 256 | 1 | 79.9 (79.6 to 81.3) | 80.7 (80.6 to 87.5) | 85.7 (85.4 to 87.8) |
| line-endings | 1280 to 1280 | 1 | 271.5 (271.2 to 272.7) | 272.4 (272.2 to 278.8) | 277.3 (277.0 to 280.7) |
| mixed-context | 15 to 257 | 27 | 527.1 (525.4 to 527.4) | 501.7 (496.5 to 503.9) | 408.9 (404.7 to 410.1) |

Times are nanoseconds per call.

## escapeAttribute

3 fresh processes per implementation. Raw data: [escapeAttribute.json](./escapeAttribute.json).

| Case | UTF-16 units (min to max) | Pool | esm | wasm | native |
|---|---:|---:|---:|---:|---:|
| short | 16 to 16 | 1 | 196.7 (196.4 to 197.7) | 316.0 (315.6 to 316.7) | 194.8 (194.3 to 198.0) |
| unchanged-16 | 16 to 16 | 1 | 38.5 (38.2 to 38.6) | 39.7 (39.6 to 39.8) | 39.4 (39.2 to 39.9) |
| first-16 | 16 to 16 | 1 | 96.2 (96.2 to 96.5) | 260.4 (258.4 to 261.5) | 95.8 (92.9 to 98.9) |
| first-31 | 31 to 31 | 1 | 108.7 (108.6 to 109.9) | 312.9 (309.7 to 315.3) | 108.0 (107.9 to 108.9) |
| first-32 | 32 to 32 | 1 | 110.6 (108.9 to 111.1) | 319.4 (315.7 to 320.2) | 109.6 (107.8 to 110.3) |
| dense-31 | 31 to 31 | 1 | 766.6 (749.8 to 767.0) | 668.3 (662.8 to 670.9) | 759.9 (758.5 to 761.1) |
| unchanged-short | 37 to 37 | 1 | 52.9 (52.9 to 53.1) | 54.3 (54.2 to 54.5) | 53.9 (53.3 to 54.4) |
| unchanged-long | 155648 to 155648 | 1 | 93974.0 (93814.5 to 93986.3) | 93914.7 (93868.1 to 93917.9) | 28785.4 (28611.5 to 28791.5) |
| quoted-json | 33171 to 33171 | 1 | 293346.3 (289663.7 to 298240.9) | 297992.9 (297855.1 to 298800.4) | 63445.3 (63379.3 to 63493.3) |
| japanese-emoji | 44032 to 44032 | 1 | 558044.0 (556478.1 to 558468.9) | 432200.2 (432004.8 to 433083.3) | 133942.8 (133628.1 to 134202.7) |
| long-body | 349440 to 349440 | 1 | 300472.9 (299854.1 to 302074.0) | 1153218.7 (1152545.2 to 1160236.3) | 237323.9 (237288.9 to 237639.2) |
| dense-quotes | 28672 to 28672 | 1 | 627722.9 (626667.4 to 642213.9) | 407113.1 (406473.2 to 407907.6) | 105121.1 (104834.2 to 105732.4) |
| first-24 | 24 to 24 | 1 | 109.4 (108.2 to 113.7) | 296.4 (294.8 to 300.9) | 105.0 (103.8 to 105.8) |
| last-31 | 31 to 31 | 1 | 105.1 (104.7 to 107.7) | 317.7 (317.1 to 324.5) | 101.3 (100.7 to 102.4) |
| two-near-31 | 31 to 31 | 1 | 135.9 (135.1 to 138.5) | 325.2 (325.0 to 333.6) | 135.7 (132.0 to 163.7) |
| two-far-31 | 31 to 31 | 1 | 131.5 (130.6 to 136.1) | 326.3 (325.8 to 334.4) | 128.8 (127.2 to 130.0) |
| dense-32 | 32 to 32 | 1 | 761.4 (753.0 to 761.7) | 679.9 (675.8 to 685.1) | 761.8 (758.6 to 761.9) |
| dense-255 | 255 to 255 | 1 | 5646.9 (5570.0 to 5663.4) | 3756.2 (3731.7 to 3761.3) | 5652.1 (5651.9 to 5672.8) |
| first-255 | 255 to 255 | 1 | 234.3 (231.7 to 236.0) | 1049.6 (1048.9 to 1052.5) | 228.8 (227.5 to 230.3) |
| first-256 | 256 to 256 | 1 | 232.7 (228.8 to 237.5) | 1058.6 (1054.5 to 1067.0) | 451.7 (447.4 to 462.0) |
| spaced-8 | 1024 to 1024 | 1 | 4921.7 (4881.3 to 4931.4) | 6235.1 (6213.1 to 6240.3) | 1549.8 (1531.3 to 1561.3) |
| spaced-32 | 1024 to 1024 | 1 | 1623.9 (1613.2 to 1626.2) | 4233.0 (4230.6 to 4246.0) | 1113.9 (1105.5 to 1116.4) |
| sparse-8192 | 8192 to 8192 | 1 | 3993.6 (3987.8 to 3998.7) | 25864.7 (25834.4 to 25882.2) | 5208.7 (5194.1 to 5212.4) |
| mixed-short | 7 to 255 | 36 | 372.5 (370.9 to 372.9) | 478.9 (477.3 to 482.0) | 385.0 (383.9 to 389.1) |
| mixed-long | 256 to 16384 | 24 | 27288.1 (26914.3 to 27310.0) | 29981.1 (29977.2 to 29988.1) | 7110.4 (7100.4 to 7130.5) |
| quotes-only | 256 to 256 | 1 | 5413.7 (5366.2 to 5424.7) | 3776.2 (3757.3 to 3777.0) | 1352.6 (1313.8 to 1367.2) |
| line-endings | 1280 to 1280 | 1 | 9061.2 (8983.9 to 9237.9) | 9767.6 (9755.4 to 9774.0) | 2133.2 (2131.6 to 2137.3) |
| mixed-context | 15 to 257 | 27 | 1288.2 (1281.4 to 1288.8) | 1191.2 (1190.0 to 1200.7) | 958.1 (953.7 to 959.7) |

Times are nanoseconds per call.

## Replay of actual Astro escape inputs

6 fresh processes per implementation and corpus, with rotated order, at least 100 ms warmup and 300 ms measurement. Values include Buffer.byteLength and are milliseconds per complete corpus, excluding imports.

Inputs were captured from fresh standard ESM Astro builds. Complete output hashes were checked against escape-html builds, and call distributions were checked against the stored profiles.

This replays only Astro escapeHTML calls. It excludes compilation, file writes, other Astro functions and startup, so it cannot establish full-build savings.

| Corpus | Calls | Implementation | Median ms | Min ms | Max ms |
|---|---:|---|---:|---:|---:|
| articles | 6000 | esm | 0.501 | 0.488 | 0.503 |
| articles | 6000 | native | 0.504 | 0.497 | 0.508 |
| articles | 6000 | wasm | 0.959 | 0.949 | 0.987 |
| articles | 6000 | escape-html | 0.538 | 0.535 | 0.539 |
| articles | 6000 | fast-escape-html | 0.524 | 0.523 | 0.530 |
| articles | 6000 | html-escaper | 0.826 | 0.823 | 0.828 |
| catalog | 33250 | esm | 8.406 | 8.299 | 8.538 |
| catalog | 33250 | native | 8.369 | 8.316 | 8.423 |
| catalog | 33250 | wasm | 13.691 | 13.520 | 13.899 |
| catalog | 33250 | escape-html | 8.314 | 8.286 | 8.358 |
| catalog | 33250 | fast-escape-html | 8.308 | 8.216 | 8.420 |
| catalog | 33250 | html-escaper | 9.221 | 9.194 | 9.300 |
| props | 384 | esm | 98.188 | 97.174 | 109.028 |
| props | 384 | native | 27.013 | 26.786 | 27.178 |
| props | 384 | wasm | 82.673 | 82.038 | 82.914 |
| props | 384 | escape-html | 92.801 | 92.576 | 93.053 |
| props | 384 | fast-escape-html | 91.652 | 91.505 | 91.908 |
| props | 384 | html-escaper | 97.578 | 97.210 | 97.668 |

Raw replay samples, input hashes, output hashes and profiles: [replay.json](./replay.json).

Reproduction commands and protocol: [benchmark guide](../../README.md#current-workspace-comparison).
