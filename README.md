# BlockWorld 3D

**BlockWorld 3D** is an original browser-based voxel sandbox prototype. The current build is **Alpha 0.3**. It is inspired by the broad construction and exploration genre; it is not Minecraft and does not include Mojang's proprietary code or game assets.

## Play with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Deploy from a branch**.
3. Select branch **main** and folder **/(root)**.
4. Save and open the Pages URL shown by GitHub.

The app loads Three.js from jsDelivr, so the first load requires an internet connection.

## Current alpha features

- Procedural voxel terrain with hills, trees, water and scattered ore deposits.
- Cinematic title screen with a live, orbiting 3D landscape preview.
- First-person voxel arm with idle, walking and mining motion.
- A staged loading screen with progress tied to terrain generation and mesh construction.
- Per-face 16×16 pixel textures with distinct grass, log, foliage and ore details.
- Instanced block rendering with six-face material groups.
- Instanced block rendering for a lower draw-call count.
- First-person camera and pointer-lock mouse look.
- WASD movement, jumping, basic collision and Creative flight.
- Block targeting, mining progress, block placement and a hotbar.
- A 36-slot inventory with stack counts and basic tool durability.
- Creative and Survival modes.
- A small data-driven recipe list and crafting screen.
- Animated passive creatures (sheep, cows and chickens) with 64×32 pixel texture atlases, idle/walk cycles and simple roaming.
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

## Development status

This is an **alpha foundation**, not a feature-complete commercial sandbox. The current creatures are a first visual/animation pass with 64×32 (2,048-pixel) per-species atlases: they do not yet have combat, breeding, drops, sound, collision-aware pathfinding or full survival behavior. Advanced survival simulation, complete recipe coverage, redstone, dimensions, chunk streaming, multiplayer, server authority, sound design and complete accessibility/performance testing are not implemented yet. Block textures are original procedural 16×16 pixel art, not official Minecraft textures.

The technical direction and planned milestones are in [docs/ROADMAP.md](docs/ROADMAP.md).
