# YGO Remote Scan

This build adds **click-to-scan on the opponent video**.

## What changed
- You no longer need manual hotspot mapping to identify opponent cards.
- Click directly on the opponent video feed.
- The app captures the current frame, tries to detect the card boundary, crops it, OCRs the card name, and searches the Yu-Gi-Oh card database.
- It keeps the existing room sync, LP sync, phase sync, webcam, and mic/audio flow.

## Important reality check
This is a **best-effort SpellTable-style prototype**, not full SpellTable parity yet.

It works best when:
- the clicked card is fully visible
- the field is well lit
- the camera is fairly steady
- the clicked card is upright or close to upright
- the card name bar is not blocked by glare

It can struggle with:
- heavy glare on sleeves
- very low resolution / blurry camera feeds
- partial overlap
- sideways defense-position monsters
- foil reflections
- poor lighting

## How to use the new scan flow
1. Both players join the same room.
2. Both players start camera + mic.
3. If voice is silent, click **Enable Opponent Audio**.
4. Click directly on a face-up card in the opponent video.
5. Check the **Scan Preview** panel and **Recognition Results** panel.
6. If the top result is wrong, click a different candidate or use manual search.

## Deployment note
This build loads:
- OpenCV.js from docs.opencv.org
- Tesseract.js from jsDelivr

So the deployed site needs normal internet access to those CDNs.
