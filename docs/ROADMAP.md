# BlockWorld 3D — Technical roadmap

## Current milestone: Alpha 0.2 — playable voxel foundation

Implemented:
- Procedural seeded terrain, trees, ore patches and water pockets.
- Generated 16×16 pixel textures and instanced block batches.
- First-person controls, basic axis collision, jump and Creative flight.
- Survival mining progress, block drops, placement and a hotbar.
- 36-slot inventory, stack limits, tool durability and starter recipes.
- Creative and Survival modes, day/night lighting and rain particles.
- Local save/load, autosave and a small command console.

## Next milestones

### Alpha 0.3 — world and block systems
- Chunk-based terrain generation and mesh rebuilding.
- More accurate face textures, block states and orientation.
- Liquid flow, light propagation and block update ticks.
- More reliable collision, stepping, swimming and fall damage.
- Better inventory drag/drop, offhand and equipment slots.

### Alpha 0.4 — survival depth
- Health, hunger, saturation, food effects and death/respawn.
- Complete tool tiers, mining requirements and drop rules.
- Furnace fuel and smelting queues.
- More recipes, crafting grid behavior and recipe book.
- Farming, crop growth and environmental interactions.

### Alpha 0.5 — entities and world simulation
- Entity framework and deterministic update loop.
- Passive wildlife, hostile creatures and basic pathfinding.
- Spawn rules, drops, breeding and interaction.
- Daylight cycle, weather effects and biome-specific rules.

### Alpha 0.6 — technical systems
- Redstone-like signal network and scheduled updates.
- Containers, hoppers, doors, switches and mechanisms.
- Structures, caves, biome layers and dimension portals.
- World import/export and versioned save migrations.

### Alpha 0.7+ — multiplayer and polish
- Server-authoritative multiplayer architecture.
- Networking, permissions and persistence.
- Audio, particles, animation, settings and accessibility.
- Profiling, automated gameplay tests and compatibility testing.

## Architecture principles

- Keep block/item definitions and recipes data-driven.
- Keep world state separate from rendering.
- Render blocks in batches; do not create one draw call per voxel.
- Keep save formats versioned and migrate old data deliberately.
- Keep original assets and code; do not bundle proprietary game files.
- Validate all player actions on the server before multiplayer release.
