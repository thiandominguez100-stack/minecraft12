# BlockWorld 3D

**BlockWorld 3D** is an original browser-based voxel sandbox prototype. The current build is **Alpha 0.6.0**. It is inspired by the broad construction and exploration genre; it is not Minecraft and does not include Mojang's proprietary code or game assets.

## Play with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Deploy from a branch**.
3. Select branch **main** and folder **/(root)**.
4. Save and open the Pages URL shown by GitHub.

The app loads Three.js from jsDelivr, so the first load requires an internet connection.

## Current alpha features

- A prebuilt 12-chunk world: 4 × 3 chunks, each 16 × 16 blocks (64 × 48 block footprint).
- Smooth, seeded terrain with connected hills, a tall snowy mountain, a winding river, a lake, meadow/forest/desert zones, broad-canopy trees, stone outcrops and a ruined landmark.
- Cinematic title screen with a live, orbiting 3D landscape preview.
- First-person voxel arm with idle, walking and mining motion.
- A staged loading screen reporting progress across all 12 terrain chunks and their separate meshes.
- Per-face 16×16 pixel textures with distinct grass, log, foliage and ore details.
- Per-chunk instanced block batches, with edits rebuilding only the affected chunk.
- First-person camera with buffered jumping, stable ground detection, AABB collision, gravity substeps, horizontal acceleration and air control.
- Jump input has no artificial cooldown; a short input buffer prevents presses from being lost just before landing.
- WASD movement, jumping, basic collision and Creative flight.
- Block targeting, mining progress, block placement and a hotbar.
- A 36-slot inventory with stack counts and basic tool durability.
- Creative and Survival modes.
- A small data-driven recipe list and crafting screen.
- Animated passive creatures (sheep, cows and chickens) with 64×32 pixel texture atlases, idle/walk/flee cycles, raycast hitboxes, health, knockback and basic drops.
- Pixel-art 16×16 hotbar/inventory icons for blocks, tools, materials and food.
- Day/night lighting, simple rain particles and weather commands.
- Local save/load in browser storage, including world edits and inventory.
- Local command console.

## Controls

| Key / input | Action |
|---|---|
| WASD | Move |
| Mouse | Look around |
| Space | Jump in Survival; rise in Creative |
| Shift | Move slowly in Survival; descend in Creative |
| Ctrl | Sprint in Survival |
| Left mouse (hold) | Mine targeted block |
| Right mouse | Place selected block or eat food |
| 1–9 | Select hotbar slot |
| E | Inventory and crafting |
| T | Command console |
| F | Save the world |
| Esc | Pause / release mouse |

Click the game canvas after closing a menu to recapture the mouse.

## Commands

- `/help`
- `/gamemode creative` or `/gamemode survival`
- `/give <item_id> [amount]`
- `/time set day` or `/time set night`
- `/weather clear` or `/weather rain`
- `/tp x y z`
- `/setblock x y z <block_id>`
- `/fill x1 y1 z1 x2 y2 z2 <block_id>` (maximum 256 blocks per command)
- `/clear`
- `/save`
- `/seed`
- `/spawn`

Some item IDs: `grass`, `dirt`, `stone`, `cobblestone`, `oak_log`, `oak_planks`, `leaves`, `sand`, `glass`, `coal_ore`, `iron_ore`, `gold_ore`, `diamond_ore`, `bedrock`, `water`, `torch`, `crafting_table`, `furnace`, `chest`, `stick`, `coal`, `iron_ingot`, `diamond`, `bread`.

## Save data

World edits, player position, inventory, game mode, time and weather are stored in the browser's localStorage. A save is local to the browser and device that created it. Clearing site data or changing browser profiles can remove access to that save.

## Alpha 0.4.0 — chunked world and terrain overhaul

- Expanded the play area from 45 × 45 to 64 × 48 block columns.
- Added 12 pre-generated chunks of 16 × 16 blocks arranged 4 × 3.
- Replaced independent per-column height randomness with continuous seeded value noise and gradual height transitions.
- Added a distinct mountain region, winding watercourse, lake basin, sandy banks, desert patch, broader forest, stone boulders and a large ruin.
- Built a separate instanced mesh group per chunk and changed raycasting to traverse those groups.
- Updated block placement/mining to rebuild only its affected chunk.
- Added regression tests for chunk coverage, deterministic terrain and neighboring height continuity.

## Alpha 0.3.1 — gameplay fixes

- Fixed the grounded-state flicker that pulled the player down and snapped them up every other frame.
- Replaced corner-only collision checks with a full player AABB query.
- Added swept vertical movement in small substeps, a stable support probe and buffered jump input.
- Added accelerated horizontal movement with ground friction and air control.
- Animals can now be targeted and hit with left click; they flash, receive knockback, flee and drop an item when defeated.
- Replaced flat color squares in the hotbar/inventory with generated 16×16 pixel-art icons.


## Alpha 0.5.0 — fluid water and swimming

- Replaced the static, breakable water-block behavior with permanent, non-solid fluid sources.
- Added discrete voxel flow: water falls vertically first, then spreads horizontally with a seven-cell level decay.
- Fluid updates run in a bounded simulation budget and rebuild only chunks touched by new water.
- Water uses a connected surface mesh: adjacent cells omit shared internal walls, share exact corner heights and only render exposed outer sides.
- Added body-submersion sampling, buoyancy, water drag, horizontal swimming and a Space-key swim stroke.
- Added an underwater blue camera tint when the player's eyes are below the water surface.
- Water source coordinates are included in local save data and restored with the world.


## Alpha 0.6.0 — connected water and live block reactions

- Replaced per-cell water cubes with a connected mesh of top surfaces and exposed outer walls, eliminating internal seams between adjacent water cells.
- Neighboring water cells share the same corner heights, blending flowing levels into continuous surfaces across block and chunk boundaries.
- Flowing water has visible levels; vertical columns remain full-height and horizontal streams lower gradually.
- Water textures are seamless and animated, with a translucent blue material and a separate underwater surface test.
- The water mesh is excluded from block targeting, so it no longer blocks mining or placing other blocks behind it.
- Breaking or placing blocks wakes connected water cells; disconnected flow is removed and the remaining water recalculates its paths from live sources.
- Blocks can now be placed into flowing water, displacing that fluid; source cells overwritten by solids are removed from the source registry.
- Bulk /fill edits trigger one fluid connectivity pass instead of rebuilding the whole world after each cell.

## Development status

This is an **alpha foundation**, not a feature-complete commercial sandbox. The current creatures are a first visual/animation pass with 64×32 (2,048-pixel) per-species atlases: they do not yet have breeding, sounds, sophisticated collision-aware pathfinding or full survival behavior. Advanced survival simulation, complete recipe coverage, redstone, dimensions, infinite chunk streaming beyond the current 12-chunk map, multiplayer, server authority, sound design and complete accessibility/performance testing are not implemented yet. Block textures are original procedural 16×16 pixel art, not official Minecraft textures.

The technical direction and planned milestones are in [docs/ROADMAP.md](docs/ROADMAP.md).
