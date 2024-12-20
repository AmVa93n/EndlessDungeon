# Endless Dungeon

[Click here to see deployed game](https://amva93n.github.io/EndlessDungeon/)

## Description
_Endless Dungeon_ is a browser game developed for Ironhack bootcamp, as the final project for its first module. It utilizes HTML, CSS and Javascript.
The game draws elements from the Dungeon Crawler and Roguelike genres, with features such as randomly generated level layouts, monsters and items that the player can interact with.
Aesthetically, the game is inspired by classic 2D top-down ARPGs such as the Zelda series.
Each level's entrance is adjacent to the previous level's exit, creating a smooth transition between levels and the illusion of a scrolling game map.
In each level, the player needs to open a chest to obtain an amulet, avoiding collision with monsters, and reach the exit in order to advance. The level score is then calculated based on the amount and strength of enemies that the player managed to avoid. The level score is then added to the total game's score.
Players generally aim for the highest score, but progress in terms of level reached is also tracked, and can be used to measure player's skill.
Due to the random placement of elements in each level, the player is often presented with _Risk vs. Reward_ dilemmas. Useful items located just outside the player's reach may require careful maneuvering to obtain, and players must decide whether to skip them and move on, or take the risk in exchange for safety and better resources on higher levels.

## Core mechanics
- **Collision algorithms**: collisions are calculated differently for various elements in the game. Monsters' collision check takes only the dimensions of the monster and the player into account, and consider any overlap between their frames as a collision. However, to determine the player's and monsters ability to move around the map, the check also considers the character's direction. Collision with items and arrows is based on the object image's real size inside its container.
- **Spawning algorithms**: spawning coordinates for each object are randomly picked upon level creation. The game will attempt to spawn a random number of objects of each type, based on the game's database that determines the minimum level at which the object may begin spawning and its individual chance to spawn. Any object that was picked for spawn goes though a loop of checks to ensure no overlap with existing objects and sufficient spacing to allow the player to freely cross the map. The game will stop attempting to spawn an object if it failed to randomize a valid spawn location for it 100 times.
- **Difficulty curve**: One additional monster spawns every 4 levels. The damage dealt by monsters is based primarily on the monster's type, each having its own range of base damage output. Stronger monster types spawn as the player progresses through the game. In addition, the total damage of all monsters increases by 1 point every 5 levels to maintain a steady difficulty curve.

## Additional features
- Score submission (achieved via local storage)
- Archery: while not necessary in order to progress through levels, the player has a bow in their disposal which they can use to shoot monsters and clear a path.
- Option to pause and resume the game session.

## Data structure
- The `Scene` static class handles transition between the game views (referred to as "scenes").
- The `Audio` static class handles playing and pausing sound effects, or fade in/out background music.
- The `Input` static class handles mouse click events and keyboard input.
- The `Data` static class handles score submission using local storage and holds the game's database of monsters and items.
- The `GameSession` class represents the Main Game scene, and it holds all methods that handle creation of new levels, randomizing values, detecting valid spawn locations and updating the game's objects and HUD elements (health bar, inventory, level and score indicators).   
- The `GameObject` class is a superclass for all objects present in the game and contains functionality common to most or all of them: movement, relocation, animation updates and collision checks.
- The `Player` class represents the player's character and its unique actions, such as collecting and using items.
- The `Enemy` class represents monsters and their unique actions, such as attacking the player and updates to their movement routines.
- The `Item` class represents items and adds functionality related to their resprctive effects.
- The `Exit` class represents the exit from the level leading into the next level. It adds functionality related to generating the next exit's location and triggering the transition sequence between levels.
- The `Entrance` class represents the entrance to a level.
- The `Chest` class represents the chest that contains the amulet in each level. It adds functionality related to generating the next chest's location and triggering the opening sequence.
- The `Arrow` class represents an arrow shot by the player and handles its movement and collisions.
- The `Trap` class represents traps that pull out and retract spikes on the floor every few seconds. It handles their state and determines if the conditions are met to deal damage to the player.
- The `Obstacle` class represents scenery objects that have collision, and characters are unable to go through.
- The `Decoration` class represents scenery objects that do not have collision and are placed under all other objects.

## States and States Transitions
The game includes 5 distinct views (scenes):
- Title Scene - serves as a landing page
- Main Game scene - where the game session takes place
- Instructions scene
- Game Over scene
- High Scores scene

## Tasks
- Main scene setup
  * Layout and dimensions of game space and objects
  * Keyboard input
- Core mechanics
  * Class structure
  * Collision and spawn algorithms
  * Level transitions
  * Progression and difficulty curve
- Asset integration
- Animations
- Styling title and game over scenes
- HUD elements
- Additional scenes
- Background music and sound effects
- Monster variety
- Scenery elements
- Items
- Archery
- Toggle prioritized item
- Traps

## Links

- [Slides Link](https://slides.com/amirvaknin/deck/fullscreen)
- [Github repository Link](https://github.com/AmVa93n/EndlessDungeon)
- [Deployment Link](https://amva93n.github.io/EndlessDungeon/)
