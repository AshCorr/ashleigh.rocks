console.log("made it here")

import { Viewport } from "pixi-viewport";
import { Application, Container, Graphics, HTMLText, Text } from "pixi.js";

const BESTAGON_RADIUS = 40;
const BESTAGON_SIDES = 6;

const Depths = {
  COSTAL: 0,
  SHALLOWS: 1,
  OPEN: 2,
  OPEN_DEEP: 3,
  ABYSSAL: 4,
  PRIMORDIAL:5
} as const;

const DEPTH_COLOURS = [
  "#38f1cc",
  "#098a70",
  "#044538",
  "#02221b",
  "#01110d",
  "#000806"
] as const;

const DEPTH_TABLE = [
  [Depths.COSTAL, Depths.COSTAL, Depths.SHALLOWS, Depths.SHALLOWS, Depths.SHALLOWS, Depths.OPEN],
  [Depths.COSTAL, Depths.SHALLOWS, Depths.SHALLOWS, Depths.SHALLOWS, Depths.OPEN, Depths.OPEN],
  [Depths.SHALLOWS, Depths.SHALLOWS, Depths.OPEN, Depths.OPEN, Depths.OPEN_DEEP, Depths.OPEN_DEEP],
  [Depths.OPEN, Depths.OPEN, Depths.OPEN, Depths.OPEN_DEEP, Depths.OPEN_DEEP, Depths.ABYSSAL],
  [Depths.OPEN_DEEP, Depths.OPEN_DEEP, Depths.ABYSSAL, Depths.ABYSSAL, Depths.ABYSSAL, Depths.PRIMORDIAL],
  [Depths.OPEN_DEEP, Depths.ABYSSAL, Depths.ABYSSAL, Depths.ABYSSAL, Depths.PRIMORDIAL, Depths.PRIMORDIAL]
] as const;

type Coordinate = {
  x: number;
  y: number;
  z: number;
};

const bestagons: number[][][] = [];
const bestagonNeighbours = ({x, y, z}: Coordinate) => [
  { x: x + 1, y, z: z - 1 },
  { x: x - 1, y, z: z + 1 },
  { x, y: y + 1, z: z - 1 },
  { x, y: y - 1, z: z + 1 },
  { x: x + 1, y: y - 1, z },
  { x: x - 1, y: y + 1, z },
];

const cubeCoordinateToScreen = ({ x, y, z }: Coordinate) => {
  const screenX = (x - z) * BESTAGON_RADIUS;
  const screenY = (x + z) * BESTAGON_RADIUS * Math.sqrt(3);
  return { x: screenX, y: screenY };
};

const randomDepth = (depth: number) => DEPTH_TABLE[depth][Math.floor(Math.random() * DEPTH_TABLE[depth].length)];

const createBestagon = ({ coordinate, depth, viewport }: {
  coordinate: Coordinate;
  depth: number;
  viewport?: Viewport;
}) => {
  bestagons[coordinate.x] = bestagons[coordinate.x] || [];
  bestagons[coordinate.x][coordinate.y] = bestagons[coordinate.x][coordinate.y] || [];

  if (bestagons[coordinate.x][coordinate.y][coordinate.z] !== undefined) {
    // If the bestagon already exists, return early
    return;
  }

  bestagons[coordinate.x][coordinate.y][coordinate.z] = depth;

  const { x, y } = cubeCoordinateToScreen(coordinate);

  const bestagon = new Graphics()
    .regularPoly(0, 0, BESTAGON_RADIUS, BESTAGON_SIDES)
    .fill(DEPTH_COLOURS[depth])
    .stroke({
      width: 1,
      color: 'black',
    });
  
  bestagon.x = x;
  bestagon.y = y;

  const bestagonIcon = new Graphics()
    .regularPoly(0, 0, BESTAGON_RADIUS/4, BESTAGON_SIDES)
    .fill('white');

  bestagon.addChild(bestagonIcon);

  bestagonIcon.addChild(
    new Text({ text: depth, anchor: { x: 0.5, y: 0.5}, style: { fontSize: 10, align: 'center' } }));

  bestagon.interactive = true;
  bestagon.onclick = () => {
    bestagonNeighbours(coordinate).map((coordinate) => createBestagon({ coordinate, depth: randomDepth(depth), viewport }));
  }
  bestagon.ontap = bestagon.onclick;

  viewport?.addChild(bestagon)
};


(async () => {
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#1099bb', resizeTo: window, hello: true, antialias: true, resolution: 2, autoDensity: true });

  const myText = new HTMLText({
    style: {
      fontSize: 20,
    },
    text: 
`<h3>Joshua's Terrain Generator Simulation</h3><b>Controls:</b>
  - <i>Click on a bestagon to reveal its neighbours.</i>
  - <i>Use mouse wheel to zoom in and out.</i>
  - <i>Drag to move around.</i>
`,

  });
  myText.x = 20;
  myText.y = 20;
  // myText.resolution = 2
  app.stage.addChild(myText);

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,
    events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  });

  viewport.x = app.screen.width / 2;
  viewport.y = app.screen.height / 2;

  app.stage.addChild(viewport);

  viewport.drag().pinch().wheel().decelerate();

  // Create and add a container to the stage
  const container = new Container();

  viewport.addChild(container);

  createBestagon({
    coordinate: { x: 0, y: 0, z: 0 },
    depth: 0,
    viewport
  })
})();