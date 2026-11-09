# BlockWorld 3D

**BlockWorld 3D** is an original browser-based voxel sandbox prototype. The current build is **Alpha 0.7.0**. It is inspired by the broad construction and exploration genre; it is not Minecraft and does not include Mojang's proprietary code or game assets.

## Play with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Deploy from a branch**.
3. Select branch **main** and folder **/(root)**.
4. Save and open the Pages URL shown by GitHub.

The app loads Three.js from jsDelivr, so the first load requires an internet connection.

## Current alpha features

- A prebuilt 64-chunk world: 8 × 8 chunks, each 16 × 16 blocks (128 × 128 block footprint).
- Smooth, seeded terrain with connected hills, a tall snowy mountain, a winding river, a lake, meadow/forest/desert zones, broad-canopy trees, stone outcrops and a ruined landmark.
- Cinematic title screen with a live, orbiting 3D landscape preview.
- First-person voxel arm with idle, walking and mining motion.
- A staged loading screen reporting progress across all 64 terrain chunks and their separate meshes.
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
| Space | Jump on land; swim upward in water; rise in Creative |
| Shift | Move slowly on land; dive down while swimming; descend in Creative |
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


## Alpha 0.7.0 — connected water and live block reactions

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

## Alpha 0.7.0 — larger world, continuous water and dive controls

- Expanded the world to 64 chunks (8 × 8), a 128 × 128 block footprint; added a second mountain region, a second lake basin and another ruined landmark.
- Increased the passive creature population and distributed animals throughout the expanded map.
- Rebuilt water tops as four-subdivision-per-block shared vertex grids; neighboring water tiles now share vertices and corner heights, with no internal side walls.
- Replaced the high-contrast tiled water pattern with a low-contrast seamless texture and animated vertex waves; water gets smooth specular highlights instead of bright block-grid stripes.
- Added downward swimming force on Shift, while Space remains the upward swim stroke. The first-person arm is smaller, opaque, rendered above translucent water and includes a visible palm and fingers.
- Added regression coverage for diving, the 64-chunk footprint and water sources refusing to overwrite solid blocks.

## Alpha 1.4.0 — 64×64 block art and expanded world

- Every block face now uses an individually designed 64 × 64 pixel texture, with nearest-pixel sampling and mipmapped distance rendering.
- Added distinct art treatments for grass tops and soil edges, layered dirt, fractured stone, bevelled cobblestone, bark and growth rings, plank seams and knots, sand ripples, bricks, minerals, bedrock, glass glints, snow, clay, moss, workbench, furnace, chest and torch.
- Leaf blocks now use alpha-cut foliage pixels, varied greens and natural gaps instead of a solid dark cube texture.
- Reworked oak trees with higher trunks, visible branching, layered irregular crowns and overlapping leaf clusters.
- Expanded the world from 100 to 144 chunks (12 × 12), each 16 × 16 blocks, for a 192 × 192 block footprint. Added a third mountain ridge, a third lake and another ruin.
- Increased animal distribution across the larger world and extended wandering bounds to the new map edges.
- Increased camera visibility and minimum night ambient lighting so detailed foliage remains readable after sunset.

## Alpha 1.4.0 — first-person foliage occlusion and Minecraft-style crafting

- Leaf blocks now render as opaque alpha-cut materials (alpha test 0.42, depth writing enabled) instead of late transparent objects. Their transparent texture holes stay open, while visible leaves depth-occlude correctly and no longer draw over the first-person hand.
- First-person arm render order is raised above world geometry to keep the held arm clearly visible.
- Rebuilt the inventory as a character-and-storage screen with a block-character preview, 27 main slots, a separate nine-slot hotbar and a personal 2 × 2 crafting grid.
- Added shaped crafting: logs to four planks, two vertically arranged planks to four sticks, and a 2 × 2 square of planks to a crafting table.
- Placing a crafting table and right-clicking it opens the 3 × 3 workbench interface. It supports wooden/stone/iron pickaxes, wooden axe, shovel, sword, furnace, chest and torches through real grid patterns.
- Craft ingredients are moved out of inventory into grid cells, consumed when crafting, and safely returned when closing the screen. Output space is checked before consuming a recipe.
- Added 2 × 2/3 × 3 recipe matching and inventory-capacity regression tests.

## Alpha 1.4.0 — stable shorelines, item sprites and third-person cameras

- River and lake beds now use a shallow shoreline profile: water depth falls toward the bank and the dry shore rises to the same waterline instead of leaving a broad, floating-looking shelf.
- Water cells track falling versus supported/settled state; a vertical stream becomes a horizontal flow when it reaches support. Water remains non-solid and continues to spread from its source.
- Increased water surface mesh subdivision, animated geometric waves, secondary ripple highlights and UV drift while preserving shared vertices and suppressing internal walls.
- Replaced generic inventory squares with cached pixel-art item sprites: isometric block cubes use each block's actual 64px face textures; apples, bread, raw foods, coal, raw ores, ingots, diamonds, wool, sticks, torches, and tools receive distinct silhouettes and highlights.
- Added F5 camera cycling: first person, third person from behind, and third person facing the player. A separate humanoid avatar follows the physics position; the third-person camera uses a world raycast to avoid clipping through terrain and trees.
- The rendered camera is decoupled from the physical player position, so third-person orbiting does not change movement, collisions, water immersion, drops or saved coordinates.

## Alpha 1.4.0 — performance optimization

- Chunks outside the adaptive render radius are hidden without removing their generated data; the range adjusts with measured frame rate.
- Block interaction and third-person camera raycasts now visit only nearby chunk groups instead of all 144 chunks.
- Water simulation updates fewer cells per tick and queues affected chunk mesh rebuilds, flushing a small number per frame to reduce frame-time spikes.
- Water surface tessellation was reduced from 6 × 6 to 3 × 3 subdivisions per fluid cell, preserving multi-scale shader animation while reducing triangles substantially.
- Renderer pixel ratio starts capped at 1.25 and automatically reduces or recovers based on measured FPS.
- Mob animation/AI updates are capped at 30 Hz; the render loop remains unrestricted.
- Added a live FPS and adaptive-quality indicator.

## Alpha 1.4.0 — natural water restoration and low-end performance

- Widened generated rivers to a roughly 19-block water footprint and enlarged the lake cores. The underwater basin transitions up to block height 5, aligning dry-bank top faces with the natural water surface at y=5.5.
- Every generated water column now has a real surface; only sparse centerline/lake-core cells are registered as active water sources. This keeps natural rivers visually continuous while avoiding thousands of source cells being simulated on world load.
- Generated water cells initialize as supported/settled instead of being incorrectly classified as falling merely because another water cell exists above them.
- Reduced water tessellation to 2 × 2 subdivisions per cell.
- Creature texture atlases are shared by species; repeated cube/hitbox geometries and common materials are cached. Distant creatures are hidden and their AI/animation pauses beyond the active player radius.
- More aggressive low-FPS scaling: renderer pixel ratio is capped at 1.0 and can fall to 0.65; the render distance drops to 3.8 chunks below 32 FPS and recovers gradually as performance improves.
- FPS indicator remains live so the player can observe adaptive quality changes.

- When an older save is loaded, legacy natural-river source entries are filtered against the new sparse source layout. Manually placed water sources outside generated channels remain restorable.

## Alpha 1.4.0 — visible water rendering fix

- Filled the entire carved basin instead of the narrower inner channel, avoiding a wide empty sand trench around the river.
- Deepened the blue water texture and increased surface opacity to 0.94; the material now writes depth, tests depth, is unaffected by tone mapping, and uses a slight polygon offset to prevent z-fighting with the shoreline.
- Water meshes now render later than terrain and bypass frustum-culling bounds that can become stale during wave animation.
- Increased natural river and lake water coverage to the full basin width, while maintaining a dry sand bank beyond the intended waterline.

## Alpha 1.4.0 — water renderer rebuilt from scratch

- Removed the custom GLSL water shader completely. Water no longer depends on custom shader compilation, interpolated wave attributes, vertex-color support or lighting.
- Rebuilt the water geometry as connected top quads and only exposed side faces, with shared continuous flat waterline across neighboring cells.
- Water now uses an opaque, unlit, depth-tested MeshBasicMaterial with a dedicated blue animated pixel-water texture. The renderer draws the water surface after terrain, while depth testing still prevents it from appearing through solid terrain.
- Kept the existing fluid simulation for flowing, falling, swimming and water placement; only the visual surface renderer was replaced.
- Added tests for visible top faces, continuous neighboring surfaces, correct waterline height and real water-block volume in generated river/lake basins.
