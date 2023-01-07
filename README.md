# Sprite Three Animation

A lib of helper function to animate sprites with R3Fiber.

R3Fiber is necessary on your project to use the functionality of this library.

## Install

```
yarn add sprite-three-animation
```

## Usage

1. get a reference to your sprite object in a `useRef()`
2. make sure the texture with the sprite sheet is loaded into the map property of the sprite geometry
3. import createAnimation from sprite-three-animator, and call the function passing an array of sprites
4. call the animation function inside of `useFrame` from R3Fiber passing the delta to the animation
5. enjoy!

```jsx
function Box(props) {
  const texture = useLoader(
    THREE.TextureLoader,
    '/skullMonkey.png',
    (texture) => {},
  );

  const sprite = useRef();

  texture.repeat.set(1 / 9, 1 / 4);

  texture.offset.x = 0;
  texture.offset.y = 0;

  const animation = createAnimation(sprite, [10, 12, 13, 14, 15, 16, 17], {
    tileSize: 64,
  });

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((clock, delta) => {
    animation(delta);
  });

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <sprite {...props} ref={sprite}>
      <spriteMaterial attach="material" map={texture} />
    </sprite>
  );
}
```

[CodeSandbox playground](https://codesandbox.io/s/test-sprite-animation-blm62p?runonclick=1&file=/src/Game.js)
