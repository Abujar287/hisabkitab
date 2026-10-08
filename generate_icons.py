import zlib
import struct
import math

def create_png(width, height, filename):
    # Create RGBA raw pixels
    raw_rows = []
    
    # Indigo to slate dark gradient
    for y in range(height):
        row = bytearray([0]) # Filter byte 0 (None)
        ny = y / height
        for x in range(width):
            nx = x / width
            
            # Rounded corners (radius ~ 22% of dimension)
            r = width * 0.22
            in_corner = False
            # Check 4 corners
            corners = [(r, r), (width - r, r), (r, height - r), (width - r, height - r)]
            # Is pixel outside the rounded rectangle?
            alpha = 255
            if x < r and y < r:
                d = math.hypot(x - r, y - r)
                if d > r: alpha = 0
            elif x > width - r and y < r:
                d = math.hypot(x - (width - r), y - r)
                if d > r: alpha = 0
            elif x < r and y > height - r:
                d = math.hypot(x - r, y - (height - r))
                if d > r: alpha = 0
            elif x > width - r and y > height - r:
                d = math.hypot(x - (width - r), y - (height - r))
                if d > r: alpha = 0

            if alpha == 0:
                row.extend([0, 0, 0, 0])
                continue

            # Background gradient: #4f46e5 (79, 70, 229) to #0f172a (15, 23, 42)
            bg_r = int(79 * (1 - ny) + 15 * ny)
            bg_g = int(70 * (1 - ny) + 23 * ny)
            bg_b = int(229 * (1 - ny) + 42 * ny)

            # Central wallet shape
            # Wallet rectangle: x from 20% to 80%, y from 30% to 70%
            wx1 = width * 0.20
            wx2 = width * 0.80
            wy1 = height * 0.32
            wy2 = height * 0.72

            col_r, col_g, col_b = bg_r, bg_g, bg_b

            # Glow in center
            dist_center = math.hypot(x - width * 0.5, y - height * 0.45)
            if dist_center < width * 0.35:
                factor = (1 - dist_center / (width * 0.35)) * 0.35
                col_r = int(col_r + (99 - col_r) * factor)
                col_g = int(col_g + (102 - col_g) * factor)
                col_b = int(col_b + (241 - col_b) * factor)

            # Wallet body (rounded rectangle)
            if wx1 <= x <= wx2 and wy1 <= y <= wy2:
                # Wallet color: Deep indigo (#312e81) with border (#6366f1)
                border_dist = min(x - wx1, wx2 - x, y - wy1, wy2 - y)
                if border_dist < width * 0.02:
                    col_r, col_g, col_b = 99, 102, 241 # #6366f1
                else:
                    col_r, col_g, col_b = 49, 46, 129 # #312e81

                # Wallet clasp on the right side: x from 60% to 82%, y from 46% to 60%
                cx1 = width * 0.60
                cx2 = width * 0.82
                cy1 = height * 0.46
                cy2 = height * 0.60
                if cx1 <= x <= cx2 and cy1 <= y <= cy2:
                    col_r, col_g, col_b = 67, 56, 202 # #4338ca
                    # Gold coin latch
                    coin_cx = width * 0.72
                    coin_cy = height * 0.53
                    coin_r = width * 0.04
                    if math.hypot(x - coin_cx, y - coin_cy) <= coin_r:
                        col_r, col_g, col_b = 56, 189, 248 # #38bdf8

            # Upward green arrow in bottom-left of wallet
            arr_cx = width * 0.35
            arr_cy = height * 0.52
            arr_r = width * 0.075
            if math.hypot(x - arr_cx, y - arr_cy) <= arr_r:
                col_r, col_g, col_b = 16, 185, 129 # #10b981

            row.extend([min(255, col_r), min(255, col_g), min(255, col_b), alpha])
        
        raw_rows.append(bytes(row))

    raw_data = b"".join(raw_rows)
    compressed = zlib.compress(raw_data, 9)

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack(">I", len(data)) + c + struct.pack(">I", crc)

    png_header = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b"IHDR", ihdr_data)
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")

    with open(filename, "wb") as f:
        f.write(png_header + ihdr + idat + iend)

create_png(192, 192, "public/pwa-192x192.png")
create_png(512, 512, "public/pwa-512x512.png")
create_png(180, 180, "public/apple-touch-icon.png")
create_png(64, 64, "public/favicon.ico")
print("PNG icons generated successfully!")
