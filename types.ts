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
