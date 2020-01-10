const boardHeight = 125;
const boardWidth = 250;
const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const goals = ['eat', 'shelter', 'resting'];
const landColor = {
  r: 71,
  g: 112,
  b: 78
};
//shelter --> move towards a shelter until an adjacent cell is a shelter, then hide self and change goal to
// resting
// idea --> add age cap where people die
// idea --> add binary sex eg man, woman
// idea --> add diseases that can spread when ppl get near
// idea --> hunger levels, have to eat more than just one food
// idea --> returning to shelter at night, chance to reproduce (how to know when)
// idea --> someday add more resources that are needed, larger map that goes outside the screen
   //different factions that capture the shelters if at night there are more of them there or something
// idea --> have a night time with monsters that come out, instead of just the next day starting instantly
// idea --> better pathing and movement... more natural somehow
let board = createArray(boardWidth,boardHeight);
const canvas = document.getElementById("simboard");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const ctx = canvas.getContext("2d");
const canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
let creatures = [];
let shelters = [];
let foods = [];
let dayCount = 0;
let longestLife = 0;
const dayLength = 2500; //ticks, so dayLength * tickLength = length in real time
let daytimeRemaining = dayLength;
createBoard();
createShelters();
createCreatures();
generateFood();
simulate();

function createShelters() {
  const numberOfShelters = 1;
  for (let i = 0 ; i < numberOfShelters; i ++) {
    shelters.push(
      createShelter(i, 124, 62)
    );
  }
  shelters.forEach(s => {
    drawCell(s.x, s.y, 84, 53, 53, 255);
    drawCell(s.x+1, s.y+1, 84, 53, 53, 255);
    drawCell(s.x, s.y+1, 84, 53, 53, 255);
    drawCell(s.x+1, s.y, 84, 53, 53, 255);
    drawCell(s.x-1, s.y-1, 84, 53, 53, 255);
    drawCell(s.x, s.y-1, 84, 53, 53, 255);
    drawCell(s.x-1, s.y, 84, 53, 53, 255);
    drawCell(s.x-1, s.y+1, 84, 53, 53, 255);
    drawCell(s.x+1, s.y-1, 84, 53, 53, 255);
  });
  updateCanvas();
}

function createShelter(shelterId, x, y) {
  return {
    shelterId: shelterId,
    x: x,
    y: y,
  };
}

function generateFood() {
  // single food stash idea:
  // const x = Math.floor(Math.random() * (boardWidth-1));
  // const y = Math.floor(Math.random() * (boardHeight-1));
  // const x1 = Math.floor(Math.random() * (boardWidth-1));
  // const y1 = Math.floor(Math.random() * (boardHeight-1));
  // const x2 = Math.floor(Math.random() * (boardWidth-1));
  // const y2 = Math.floor(Math.random() * (boardHeight-1));
  // const xs = [x, x1, x2];
  // const ys = [y, y1, y2];
  // for (let n = 0; n < (Math.floor(creatures.length/2)); n++) {
  //   foods.push({
  //     x: xs[Math.floor(Math.random()*xs.length)],
  //     y: ys[Math.floor(Math.random()*ys.length)]
  //   });
  // }
  //

  // random spot
  for (let n = 0; n < (Math.floor(creatures.length/2)); n++) {
    foods.push({
      x: Math.floor(Math.random() * (boardWidth-1)),
      y: Math.floor(Math.random() * (boardHeight-1))
    });
  }
  //

  foods.forEach(food => {
    drawCell(food.x, food.y, 255, 230, 0, 255);
  })

  updateCanvas();
}

function resetFood() {
  foods.forEach(f => {
    drawCell(f.x, f.y, landColor.r, landColor.g, landColor.b, 255);
  });
  foods = [];
}

function killStarvingCreatures() {
  const oldpop = creatures.length;
  deadCreatures = creatures.filter(c => c.goal === 'eat');
  deadCreatures.forEach(c => drawCell(c.x, c.y, landColor.r, landColor.g, landColor.b, 255));
  creatures = creatures.filter(c => c.goal !== 'eat');
  const newpop = creatures.length;
  creatures.forEach(c => c.goal = 'eat');
  console.log('Population growth: ' + (newpop-oldpop));
}

function statusReportToConsole() {
  let sumDaysSurvived = 0;
  let avgDaysSurvived = 0;
  if (creatures.length) {
    sumDaysSurvived = creatures.reduce(function(a, b) { return a + b.daysSurvived;}, 0);
    // console.log(sumDaysSurvived);
    avgDaysSurvived = sumDaysSurvived / creatures.length;
  }
  let sumSpeed = 0;
  let avgSpeed = 0;
  if (creatures.length) {
    sumSpeed = creatures.reduce(function(a, b) { return a + b.speed;}, 0);
    // console.log(sumSpeed);
    avgSpeed = sumSpeed / creatures.length;
  }
  let sumViewDistance = 0;
  let avgViewDistance = 0;
  if (creatures.length) {
    sumViewDistance = creatures.reduce(function(a, b) { return a + b.viewDistance;}, 0);
    // console.log(sumViewDistance);
    avgViewDistance = sumViewDistance / creatures.length;
  }

  var tmp;
  for (var i=0; i<creatures.length; i++) {
    tmp = creatures[i];
    if (tmp.daysSurvived > longestLife) longestLife = tmp.daysSurvived;
  }
  console.log('Longest life: ' + longestLife);
  console.log('Total Popuatlion: ' + creatures.length);
  console.log('Average Days Survived: ' + avgDaysSurvived);
  console.log('Average Speed: ' + avgSpeed);
  console.log('Average View Distance: ' + avgViewDistance);
}

function budCreatures() {
  let newCreatures = 0;
  creatures.forEach(c => {
    creatures.push({
      x: c.x,
      y: c.y,
      direction: c.direction,
      goal: 'eat',
      viewDistance: c.viewDistance,
      speed: c.speed,
      ticksUntilMovement: c.speed,
      ticksSurvived: 0,
      daysSurvived: 0,
      bodyColor: c.bodyColor,
      trailColor: c.trailColor
    });
    newCreatures++;
  });
  console.log(newCreatures + ' new creatures born');
}

function simulate() {
  setInterval(function(){
    if (daytimeRemaining === 0) {
      killStarvingCreatures();
      creatures.forEach(c => c.daysSurvived++);
      dayCount++;
      console.log('DAY ' + dayCount + ' OVER');
      statusReportToConsole();
      console.log('----------------------------');
      resetFood();
      budCreatures();
      generateFood();
      daytimeRemaining = dayLength;
    } else {
      daytimeRemaining--;
      //console.log(daytimeRemaining);
    }
    // console.log(daytimeRemaining);
    creatures.forEach(c => {
      manageCreature(c);
    });
    creatures.forEach(c => c.ticksSurvived++);
    updateCanvas();
  }, 20);
}

function canSeeFood(c) {
  const xpos = c.x;
  const ypos = c.y;
  const viewDistance = c.viewDistance;
  //console.log(foods);
  for (let i = 0; i < foods.length; i++) {
    let foodItem = foods[i];
    if (
      (foodItem.x > (c.x - c.viewDistance) && foodItem.x < (c.x + c.viewDistance))
      && (foodItem.y > (c.y - c.viewDistance) && foodItem.y < (c.y + c.viewDistance))
    ) {
      // console.log(f);
      return true;
    }
  }
  return false;
  // find the gird representing what they can see, if it contains food return true
}

function cellContainsFood(x, y) {
  return foods.filter(f => f.x === x && f.y === y).length > 0;
}

function getDirectionTowardsNearestFood(c) {
  let foodNearby = foods.filter(f => {
    return (f.x > (c.x - c.viewDistance) && f.x < (c.x + c.viewDistance))
    && (f.y > (c.y - c.viewDistance) && f.y < (c.y + c.viewDistance));
  });
  // filter down to closest one
  // return direction of that one...
  foodNearby = foodNearby.map(f => {
    return {
      x: f.x,
      y: f.y,
      distance: Math.sqrt(Math.pow(c.x-f.x, 2) + Math.pow(c.y-f.y, 2))
    }
  });
  const target = getMinDistance(foodNearby);
  if (c.x > target.x && c.y > target.y) {
    return 'nw';
  } else if (c.x > target.x && c.y < target.y) {
    return 'sw';
  } else if (c.x < target.x && c.y < target.y) {
    return 'se';
  } else if (c.x < target.x && c.y > target.y) {
    return 'ne';
  } else if (c.x > target.x) {
    return 'w';
  } else if (c.x < target.x) {
    return 'e';
  } else if (c.y < target.y) {
    return 's';
  } else if (c.y > target.y) {
    return 'n';
  }
}

function getMinDistance(distances) {
  var lowest = distances[distances.length-1];
  var tmp;
  for (var i=distances.length-1; i>=0; i--) {
    tmp = distances[i];
    if (tmp.distance < lowest.distance) lowest = tmp;
  }
  return lowest;
}

function eatFood(c) {
  var index = -1; // -1 if not found
  for (var i = 0; i < foods.length; ++i){
    var element = foods[i];
    if (element.x === c.x && element.y === c.y) {
        index = i;
        break;
    }
  }
  if (index!==-1) {
    foods.splice(index, 1);
  }
  c.goal = 'resting';
}

function manageCreature(c) {
  if (c.goal === 'eat' && cellContainsFood(c.x, c.y)) {
    eatFood(c);// foods.splice(foods.indexOf(f => (f.x === c.x) && (f.y === c.y)), 1);
  }
  if (c.ticksUntilMovement === 0) {
    let availableDirections = [];
    if (c.goal ==='eat' && canSeeFood(c)) {
      //console.log('CAN SEE FOOD');
      availableDirections = [getDirectionTowardsNearestFood(c)];
      // console.log(availableDirections);
    } else if (c.goal === 'eat'){
      availableDirections = getRandomDirectionsAvailable(c);
    } else if (c.goal === 'resting') {
      drawCell(c.x, c.y, c.bodyColor.r, c.bodyColor.g, c.bodyColor.b, 255);
    }
    if (availableDirections.length > 0) {
      c.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
      moveCreature(c);
    }
  } else {
    c.ticksUntilMovement = c.ticksUntilMovement - 1;
  }
}

function getRandomDirectionsAvailable(c) {
  const availableDirections = [];
  if (c.x>0 && c.y>0) {
    availableDirections.push('nw');
  }
  if (c.y>0) {
    availableDirections.push('n');
  }
  if (c.x < boardWidth-1 && c.y > 0) {
    availableDirections.push('ne');
  }

  if (c.x>0 && c.y<boardHeight-1) {
    availableDirections.push('sw');
  }
  if (c.y < boardHeight-1) {
    availableDirections.push('s');
  }
  if (c.x<boardWidth-1 && c.y<boardHeight-1) {
    availableDirections.push('se');
  }

  if (c.x < boardWidth-1) {
    availableDirections.push('e');
  }
  if (c.x > 0) {
    availableDirections.push('w');
  }
  // if they can continue in their current direction, weight towards that one
  if (availableDirections.indexOf(c.direction) >= 0) {
    for (let i = 0; i < 20; i++) {
      availableDirections.push(c.direction); //weighted to current direction
    }
  }
  return availableDirections;
}

function moveCreature(c) {
  // leave trail
  //drawCell(c.x, c.y, c.bodyColor.r, c.bodyColor.g, c.bodyColor.b, 255);
  // no trail
  drawCell(c.x, c.y, landColor.r, landColor.g, landColor.b, 255);
  if (c.direction === 'n') {
    c.y = c.y-1;
  } else if (c.direction === 's') {
    c.y = c.y + 1;
  } else if (c.direction === 'w') {
    c.x = c.x-1;
  } else if (c.direction === 'e') {
    c.x = c.x+1;
  } else if (c.direction === 'ne') {
    c.y = c.y-1;
    c.x = c.x+1
  } else if (c.direction === 'nw') {
    c.y = c.y - 1;
    c.x = c.x - 1
  } else if (c.direction === 'se') {
    c.x = c.x+1;
    c.y = c.y+1;
  } else if (c.direction === 'sw') {
    c.x = c.x-1;
    c.y = c.y+1;
  }
  if (c.ticksUntilMovement === 0) {
    c.ticksUntilMovement = c.speed;
  }
  drawCell(c.x, c.y, c.bodyColor.r, c.bodyColor.g, c.bodyColor.b, 255);
}

function createCreatures() {
  creatures = [];
  for (let i = 0; i < 1000; i++) {
    //viewDistance is a tradeoff with speed...
    const speed = getRandomInt(1, 20);
    //const viewDistance = getRandomInt(10, 100);
    const viewDistance = Math.floor((90 - ((20-speed)/20)*90) +10);
    const creature = {
      x: 124,// Math.floor(Math.random()*(boardWidth-1)),
      y: 62,// Math.floor(Math.random()*(boardHeight-1)),
      direction: 'n',
      goal: 'eat',
      viewDistance: viewDistance,//Math.floor(Math.random()*50), //how many tiles away they can see food or other creatures
      speed: speed, // every one tick, move a space
      ticksUntilMovement: speed,
      ticksSurvived: 0,
      daysSurvived: 0,
      bodyColor: getColorBasedOnStats(speed, viewDistance),
      trailColor: getRandomColor()
    }
    //console.log(creature);
    creatures.push(creature);
  }
  creatures.forEach(c => {
    drawCell(c.x,c.y, c.bodyColor.r, c.bodyColor.g, c.bodyColor.b, 255);
  });
  updateCanvas();
}

function getColorBasedOnStats(s, v) {
  const r = (s/20) * 255;
  const g = 0;//(v/100) * 255;
  const b = (v/100) *255;
  return {r:r, g:0, b:b};
}

function createBoard() {
  for (let i = 0; i < boardWidth; i++) {
    for (let j = 0; j < boardHeight; j++) {
      board[i][j] = Math.random() < 1 ? createLand() : createWater();
    }
  }

  for (let x=0; x<boardWidth; x++) {
    for (let y=0; y<boardHeight; y++) {
      const object = board[x][y];
      if (object.terrainType === 'land') {
        drawCell(x, y, landColor.r, landColor.g, landColor.b, 255);
      } else if (object.terrainType === 'water') {
        drawCell(x, y, 82, 139, 196, 255);
      }
    }
  }
  updateCanvas();
}

function drawCell(cellX, cellY, r, g, b, a) {
  const trueX = cellX * 4;
  const trueY = cellY * 4;
  drawPixel(trueX, trueY, r, g, b, a);
  drawPixel(trueX, trueY+1, r, g, b, a);
  drawPixel(trueX+1, trueY, r, g, b, a);
  drawPixel(trueX+1, trueY+1, r, g, b, a);
  drawPixel(trueX, trueY+2, r, g, b, a);
  drawPixel(trueX+2, trueY, r, g, b, a);
  drawPixel(trueX+2, trueY+2, r, g, b, a);
  drawPixel(trueX, trueY+3, r, g, b, a);
  drawPixel(trueX+3, trueY, r, g, b, a);
  drawPixel(trueX+3, trueY+3, r, g, b, a);
  drawPixel(trueX+1, trueY+2, r, g, b, a);
  drawPixel(trueX+2, trueY+1, r, g, b, a);
  drawPixel(trueX+1, trueY+3, r, g, b, a);
  drawPixel(trueX+3, trueY+1, r, g, b, a);
  drawPixel(trueX+2, trueY+3, r, g, b, a);
  drawPixel(trueX+3, trueY+2, r, g, b, a);
}

function createLand() {
  return {
    terrainType: 'land'
  };
}

function createWater() {
  return {
    terrainType: 'water'
  }
}

// That's how you define the value of a pixel //
function drawPixel (x, y, r, g, b, a) {
    var index = (x + y * canvasWidth) * 4;
    var index2 = (x + y * canvasWidth) * 4;
    var index3 = (x + y * canvasWidth) * 4;
    var index4 = (x + y * canvasWidth) * 4;
    canvasData.data[index + 0] = r;
    canvasData.data[index + 1] = g;
    canvasData.data[index + 2] = b;
    canvasData.data[index + 3] = a;
}

// That's how you update the canvas, so that your //
// modification are taken in consideration //
function updateCanvas() {
    ctx.putImageData(canvasData, 0, 0);
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function getRandomColorVal() {
  return Math.floor(Math.random() * Math.floor(255));
}

function getRandomColor() {
  const colors = [
    {
      r: 54,
      g: 231,
      b: 48
    },
    {
      r: 193,
      g: 141,
      b: 142
    },
    {
      r: 198,
      g: 30,
      b: 26
    },
    {
      r: 64,
      g: 9,
      b: 72
    },
    {
      r: 234,
      g: 47,
      b: 229
    },
    {
      r: 73,
      g: 193,
      b: 238
    },
    {
      r: 142,
      g: 176,
      b: 2
    },
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
