# Sprite Three Animation

A lib of helper functions to animate sprites with R3Fiber.

R3Fiber is necessary on your project to use the functionality of this library.

## Install

```
yarn add sprite-three-animation
```

## Usage

1. get a reference to your sprite object in a `useRef()`
2. make sure the texture with the sprite sheet is loaded into the map property of the sprite geometry
3. import createAnimation from sprite-three-animator, and call the function passing an array of numbers representing the sequence of sprites that conform the animation.

> If the sprite is bigger than `32px` pass an option object with the tileSize as a number or an array of numbers for width and height (for example. 64 or [32, 64])

> More complex animations are also supported:

```js
{
  port?: { x?: number; y?: number;};
  move?: { x?: number; y?: number;};
  tileid?: number;
  duration: number;
}[]
```

4. call the animation function inside of `useFrame` from R3Fiber passing the delta to the animation 5. enjoy!

```jsx
function Box(props) {
  const texture = useLoader(THREE.TextureLoader, '/skullMonkey.png');
  const sprite = useRef();

  const animation = createAnimation(sprite, [10, 12, 13, 14, 15, 16, 17], {
    tileSize: 64,
  });

  useFrame((clock, delta) => {
    /* 
     You can pass a boolean as second argument to control the activation of the animation. see type options for more info.
   
     for example:
     const control: boolean = isUpKeyPressed() 
     animation(delta, control)
    */
    animation(delta);
  });

  return (
    <sprite {...props} ref={sprite}>
      <spriteMaterial attach="material" map={texture} />
    </sprite>
  );
}
```

[CodeSandbox playground](https://codesandbox.io/s/test-sprite-animation-blm62p?runonclick=1&file=/src/Game.js)

## createAnimation Options

- tileSize?: `number | [number number]`

  Size in pixels of a tile in the Sprite Sheet

  Tile size in pixels `[<size for x>,<size for y>]`, single number is shorthand for square tiles.

  If undefined defaults to `tileSize: "32"`

- frameDuration?: `number`

  Number in milliseconds for the duration of each sprite in the animation

  💥 Use this option only with `number[]` animations

  If undefined defaults to `frameDuration: "100"`

- constantMove?: `{ x?: number; y?: number;}`

  Sprite position update on every frame, accept negative numbers too.

  If undefined defaults to `{ x: 0, y: 0 }`

- type?: `'single onPress' | 'single' | 'loop'`

  Type of animation:

  `loop`: the animation will loop infinite time. If control is passed to false the animation will stop.

  `single`: the animation do a single loop and stop (currently only working with complex animations)

  `single onPress`: the animation do a single loop but only while the control argument to the animation function call in `useFrame` is passed as true. (currently only working with complex animations)

  The animation will stop after a single loop and only being restarted until the control is set to false and true again.

  if undefined defaults to `type: "loop"`

- quickStart?: `boolean`

  💥 Not compatible with `number[]` animations, if this feature is needed use a complex animation array.

  Set the animation to call the first animation step immediately instead of wait the first time duration, if `true` the first step duration will be ignored. \*

  if undefined defaults to `quickStart: "false"`

## Other Relevant Types

```ts
type GameAnimationStep = {
  port?: {
    x?: number;
    y?: number;
  };
  move?: {
    x?: number;
    y?: number;
  };
  tileid?: number;
  duration: number;
};
type GameSpriteAnimation = GameAnimationStep[];

type AnimationOptions<T extends number[] | GameSpriteAnimation> = {
  /** Tile size in pixels `[<size for x>,<size for y>]`, single number is shorthand for square tiles.
   *
   *  if undefined defaults to `tileSize: "32"`
   */
  tileSize?: number | [number, number];
  /** if undefined defaults to `frameDuration: "100"`
   *
   *    💥 Use this option only with `number[]` animations
   */
  frameDuration?: T extends number[] ? number : never;
  /** Sprite position update on every frame, accept negative numbers too.
   *
   *  if undefined defaults to `{ x: 0, y: 0 }`
   */
  constantMove?: {
    x?: number;
    y?: number;
  };
  /** Type of animation modifying how the function interacts with control,
   *
   * if undefined defaults to `type: "loop"`
   *
   *    💥 Not compatible with `number[]` animations,
   *    for "single" and "single onPress" use a complex animation array.
   */
  type?: 'single onPress' | 'single' | 'loop';
  /** Set the animation to call the first animation step immediately instead of wait the first time duration, if `true` the first step duration will be ignored.
   *
   *  if undefined defaults to `quickStart: "false"`
   *
   *    💥 Not compatible with `number[]` animations, if this feature is needed use a complex animation array.
   */
  quickStart?: T extends GameSpriteAnimation ? boolean : never;
};
```

NOTE: I understand this DOCS are incomplete, they are a work in progress. Thanks for understand.
