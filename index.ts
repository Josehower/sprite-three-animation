import { MutableRefObject } from 'react';

type TiledAnimationStep = {
  duration: number;
  tileid: number;
};

type GameAnimationStep = Omit<TiledAnimationStep, 'tileid'> & {
  port?: {
    x?: number;
    y?: number;
  };
  move?: {
    x?: number;
    y?: number;
  };
  tileid?: number;
};

export type GameSpriteAnimation = GameAnimationStep[];

export type AnimationOptions<T extends number[] | GameSpriteAnimation> = {
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
  constantMove?: { x?: number; y?: number };
  /** if undefined defaults to `type: "loop"`*/
  type?: 'single onPress' | 'single' | 'loop';
  /** Set the animation to call the first animation step immediately instead of wait the first time duration, if `true` the first step duration will be ignored.
   *
   *  if undefined defaults to `quickStart: "false"`
   *
   *    💥 Not compatible with `number[]` animations, if this feature is needed use a complex animation array.
   */
  quickStart?: T extends GameSpriteAnimation ? boolean : never;
};

export function tiledToR3FTextureTranspiler(
  tileValue: number,
  imageWidth: number,
  imageHeight: number,
  tileSize: number | [number, number],
) {
  const tileSizeVector = Array.isArray(tileSize)
    ? tileSize
    : [tileSize, tileSize];

  // image width and height size (e.g 512px) / tile width and height size (e.g. 32px)
  const tilesAmountX = imageWidth / tileSizeVector[0];
  const tilesAmountY = imageHeight / tileSizeVector[1];

  // X coordinate position of the texture based on the tilesetValue for this tile
  const texturePositionX = Math.floor(tileValue % tilesAmountX);

  // X coordinate position of the texture based on the tilesetValue for this tile
  const texturePositionY =
    -1 + tilesAmountY - Math.floor(tileValue / tilesAmountX);

  return {
    repeat: { x: 1 / tilesAmountX, y: 1 / tilesAmountY },
    offset: {
      x: texturePositionX / tilesAmountX,
      y: texturePositionY / tilesAmountY,
    },
  };
}

/**
 Create a function that switch the texture offset of the tile based on an input name.

 The number represent the position of the tile on the texture, number 0 represent the topmost leftmost tile and keep counting left to right.
 */
export function createTileTextureAnimator(
  texture: THREE.Texture,
  tileSize: number | [number, number],
  startValue: number = 0,
) {
  // This seems to be unnecessary but probably need a bit more of research
  // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const tileSizeVector = Array.isArray(tileSize)
    ? tileSize
    : [tileSize, tileSize];

  // image width and height size (e.g 512px) / tile width and height size (e.g. 32px)
  const tilesAmountX = texture.image.width / tileSizeVector[0];
  const tilesAmountY = texture.image.height / tileSizeVector[1];

  // X coordinate position of the texture based on the tilesetValue for this tile
  const texturePositionX = Math.floor(startValue % tilesAmountX);

  // X coordinate position of the texture based on the tilesetValue for this tile
  const texturePositionY =
    -1 + tilesAmountY - Math.floor(startValue / tilesAmountX);

  texture.repeat.set(1 / tilesAmountX, 1 / tilesAmountY);

  texture.offset.x = texturePositionX / tilesAmountX;
  texture.offset.y = texturePositionY / tilesAmountY;

  return (value: number) => {
    const { offset } = tiledToR3FTextureTranspiler(
      value,
      texture.image.width,
      texture.image.height,
      tileSize,
    );

    texture.offset.x = offset.x;
    texture.offset.y = offset.y;
  };
}

/**
 Create a function that animate target sprite from an array of tileid numbers, or a complex GameSpriteAnimation.

 Function is also compatible with `Tiled` animations format.

 The Function must be called inside of `useFrame` or `raf` since depends of a delta value to count.
 */
export function createAnimation<
  AnimationType extends GameSpriteAnimation | number[],
>(
  spriteRef: MutableRefObject<THREE.Sprite>,
  animation: AnimationType,
  options?: AnimationOptions<AnimationType>,
) {
  let animationFunction: (delta: number, control?: boolean) => void;

  const closure = spriteRef;

  return (delta: number, control?: boolean) => {
    if (!closure.current) return;

    if (!animationFunction) {
      animationFunction = createSpriteAnimation(
        closure.current,
        animation,
        options,
      );
    }

    animationFunction(delta, control);
  };
}

/**
 Create a function that animate target sprite from an array of tileid numbers, or a complex GameSpriteAnimation.

 Function is also compatible with `Tiled` animations format.

 The Function must be called inside of `useFrame` or `raf` since depends of a delta value to count.
 */
export function createSpriteAnimation<
  AnimationType extends GameSpriteAnimation | number[],
>(
  spriteRef: THREE.Sprite,
  animation: AnimationType,
  options?: AnimationOptions<AnimationType>,
) {
  const tileSizeDefault = 32;
  const frameDurationDefault = 100;
  const moveXDefault = 0;
  const moveYDefault = 0;
  const typeDefault = 'loop';
  const quickStartDefault = false;

  let complexAnimation: GameSpriteAnimation = [];
  let numberAnimation: number[] = [];
  const isComplexAnimation = !Number(animation[0]);

  if (isComplexAnimation) {
    complexAnimation = animation as GameSpriteAnimation;
  } else if (animation[0]) {
    numberAnimation = animation as number[];
  } else {
    throw new Error('Animation is empty');
  }

  if (!spriteRef.material.map) {
    throw new Error('Sprite must contain a texture to animate');
  }

  const animator = createTileTextureAnimator(
    spriteRef.material.map,
    (options && options.tileSize) || tileSizeDefault,
  );

  const animationCallback = (activator: number) => {
    const currentAnimationStepIndex = activator % animation.length;
    const tileid = isComplexAnimation
      ? complexAnimation[currentAnimationStepIndex].tileid
      : numberAnimation[currentAnimationStepIndex];

    if (
      isComplexAnimation &&
      complexAnimation[currentAnimationStepIndex].port
    ) {
      const { x, y } = complexAnimation[currentAnimationStepIndex].port || {};

      // update the position one time by step of the sprite, causing a teleport effect
      spriteRef.position.x += x || 0;
      spriteRef.position.y += y || 0;
    }
    if (typeof tileid !== 'undefined') {
      animator(tileid);
    }
  };

  // Closures to store sprite animation state.
  const animationType = (options && options.type) || typeDefault;

  let isFirstIterationActive =
    animationType === 'single onPress'
      ? true
      : animationType === 'single'
      ? false
      : undefined;

  let isControlReleased = true;
  let isAnimationActive = false;

  const regulator = createAnimationFrameRegulator(
    animationCallback,
    isComplexAnimation
      ? complexAnimation.map((frame) => frame.duration)
      : options && options.frameDuration
      ? [options.frameDuration]
      : [frameDurationDefault],
    {
      onEveryCall: (index) => {
        if (isComplexAnimation && complexAnimation[index].move) {
          const { x, y } = complexAnimation[index].move || {};

          spriteRef.position.x += x || 0;
          spriteRef.position.y += y || 0;
        }

        spriteRef.position.x +=
          (options && options.constantMove?.x) || moveXDefault;
        spriteRef.position.y +=
          (options && options.constantMove?.y) || moveYDefault;
      },
      onRoundEnd: () => {
        isFirstIterationActive = false;
        isAnimationActive = false;
      },
      quickStart:
        animationType === 'loop'
          ? true
          : (options && options.quickStart) || quickStartDefault,
    },
  );
  const reset = regulator(0);
  return (delta: number, control: boolean = true) => {
    if (animationType === 'single onPress') {
      //  We want the single round animation stop as soon as the user release the button
      if (control && isFirstIterationActive) {
        isAnimationActive = true;
        regulator(delta);
      } else if (!control) {
        isFirstIterationActive = true;
        isAnimationActive = false;
        reset();
      }
    } else if (animationType === 'single') {
      //  We want the single round animation keep going even if the user release the button
      if (isFirstIterationActive) {
        regulator(delta);
      } else if (control) {
        if (isControlReleased) {
          isFirstIterationActive = true;
          isAnimationActive = true;
          isControlReleased = false;
          reset();
        }
      } else {
        isControlReleased = true;
      }
    } else {
      //  We want the animation keep looping as long as the user press the button
      if (control) {
        regulator(delta);
        isAnimationActive = true;
      } else {
        reset();
        isAnimationActive = false;
      }
    }

    return isAnimationActive;
  };
}

/**
 Create a function that wait x ms before trigger the callback.

 The Function must be called inside of `useFrame` or `raf` since depends of a delta value to count.

 Use This to wrap functions that need to be called multiple times on the `useFrame` hook but shouldn't be called on every frame.

 The function allow the option of variable waiting times when receive an array of numbers, the index of the current number in the array is being past to the function onEveryCall. If the ms value is a number index is always 0.

 >Use this index to do something on every call based on the time you are awaiting. If the ms value is a number index is always 0

 >i.e. on animations that require movement on every frame.

 */
function createAnimationFrameRegulator(
  callBackFunc: (activator: number, reset?: () => void) => any,
  ms: number[] | number,
  options?: {
    onEveryCall?: (currentIndex: number) => void;
    onRoundEnd?: () => void;
    quickStart?: boolean;
  },
) {
  const isMsArray = Array.isArray(ms);
  const { onRoundEnd, onEveryCall, quickStart } = options || {};

  if (!isMsArray && onRoundEnd) {
    throw new Error('ms must be an array to use option afterRound');
  }

  const ini = typeof quickStart === 'undefined' ? true : quickStart;

  const initialAccumulator = ini ? (isMsArray ? ms[0] : ms) : 0;

  let msIndex = 0;
  let deltaAccumulator = initialAccumulator;
  let activator = 0;

  function reset() {
    msIndex = 0;
    deltaAccumulator = initialAccumulator;
    activator = 0;
  }

  return function (frameDelta: number): () => void {
    deltaAccumulator += frameDelta * 1000;

    onEveryCall && onEveryCall(msIndex);

    if (deltaAccumulator >= (isMsArray ? ms[msIndex] : ms)) {
      callBackFunc(activator, reset);
      deltaAccumulator = 0;
      activator += 1;
      if (isMsArray && ms[msIndex + 1]) {
        msIndex += 1;
      } else if (isMsArray) {
        msIndex = 0;
        onRoundEnd && onRoundEnd();
      }
    }

    return reset;
  };
}
