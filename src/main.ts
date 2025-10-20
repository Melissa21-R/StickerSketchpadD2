import "./style.css";

class DrawCommand {
  private points: Array<[number, number]>;
  private thickness: number;

  constructor(initialX: number, initialY: number, thickness: number) {
    this.points = [[initialX, initialY]];
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push([x, y]);
  }

  isValid(): boolean {
    return this.points.length > 1;
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.lineWidth = this.thickness;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    ctx.beginPath();
    ctx.moveTo(this.points[0]![0], this.points[0]![1]);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i]![0], this.points[i]![1]);
    }
    ctx.stroke();
  }
}

class ToolPreview {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  update(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }
}

//make the title for the top of the screen
const title = document.createElement("h1");
title.textContent = "Sketch Pad";
document.body.appendChild(title); //append it so it goes on screen

//create the canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "skCanvas"; //making it easy to style
document.body.appendChild(canvas); //append it so it goes on screen

//time to paint (simple marker drawing)
let isDrawing = false; //will track mouse down or upppp
const displayList: DrawCommand[] = [];
const undoStack: DrawCommand[] = [];
let currentLine: DrawCommand | null = null;
let toolPreview: ToolPreview | null = null;

//set base drawing thickness
let selectedThickness: number = 2;
/*
let selectedSticker: string | null = null;
const stickers = ["🍄", "🌿", "🦋", "🪵", "🍀", "💧", "🌟", "🍃"];
const stickerPallette = document.createElement("div");
stickerPallette.id = "sticker-pallette";
document.body.appendChild(stickerPallette);
*/

//make our redraw function
function redraw() {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  displayList.forEach((command) => command.display(ctx));
  toolPreview?.display(ctx);
  currentLine?.display(ctx);
}

/*
  placedStickers.forEach((sticker) => {
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sticker.emoji, sticker.x, sticker.y);
  });
  */

//add our drawing event listeners for mouse down and up
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  /*
  if (selectedSticker) {
    placedStickers.push({ x, y, emoji: selectedSticker });
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    return;
  }
  */

  isDrawing = true;
  currentLine = new DrawCommand(x, y, selectedThickness);
  currentLine?.drag(x, y);
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  canvas.dispatchEvent(
    new CustomEvent("tool-moved", {
      detail: { x, y },
    }),
  );

  if (isDrawing) {
    currentLine?.drag(x, y);
    redraw();
  }
});

canvas.addEventListener("tool-moved", (e) => {
  const { x, y } = (e as CustomEvent).detail;
  toolPreview = new ToolPreview(x, y, selectedThickness);
  redraw();
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentLine) {
    if (currentLine && currentLine.isValid()) {
      displayList.push(currentLine);
    }
    currentLine = null;
  }
  isDrawing = false;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mouseout", () => {
  if (isDrawing && currentLine) {
    if (currentLine.isValid()) {
      displayList.push(currentLine);
    }
    currentLine = null;
  }
  isDrawing = false;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

function undo() {
  if (displayList.length === 0) return;

  const lastLine = displayList.pop();
  if (lastLine) {
    undoStack.push(lastLine);
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  }
}

function redo() {
  if (undoStack.length === 0) return;
  const line = undoStack.pop();
  if (line) {
    displayList.push(line);
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  }
}

//make thicknewss for drawing button
const toolsDiv = document.createElement("div");
toolsDiv.textContent = "Markers: ";

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin Stroke";
thinBtn.addEventListener("click", () => {
  selectedThickness = 2;
  thinBtn.classList.add("selectedTool");
  thickBtn.classList.remove("selectedTool");
});

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick Stroke";
thickBtn.addEventListener("click", () => {
  selectedThickness = 8;
  thickBtn.classList.add("selectedTool");
  thinBtn.classList.remove("selectedTool");
});

toolsDiv.appendChild(thinBtn);
toolsDiv.appendChild(thickBtn);
document.body.appendChild(toolsDiv);

thinBtn.classList.add("selectedTool");

//make the undo button
const undoB = document.createElement("button");
undoB.textContent = "Undo";
undoB.addEventListener("click", undo);
document.body.appendChild(undoB);

const redoB = document.createElement("button");
redoB.textContent = "Redo";
redoB.addEventListener("click", redo);
document.body.appendChild(redoB);

//add the clear buttonnnnn
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  displayList.length = 0;
  //placedStickers.length = 0;
  currentLine = null;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});
document.body.appendChild(clearButton); //add that button to the screen

/*
//make sticker button
stickers.forEach((sticker) => {
  const emojiSticker = document.createElement("button");
  emojiSticker.textContent = sticker;
  emojiSticker.classList.add("sticker-button");
  emojiSticker.addEventListener("click", () => {
    selectedSticker = sticker;
    document.querySelectorAll(".sticker-button").forEach((btn) => {
      btn.classList.remove("selected");
    });
    emojiSticker.classList.add("selected");
  });
  stickerPallette.appendChild(emojiSticker);
});


//stickers now show on notepad
const placedStickers: Array<{ x: number; y: number; emoji: string }> = [];
*/
canvas.addEventListener("drawing-changed", redraw);
