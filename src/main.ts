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

class StickerCommand {
  private point: [number, number];
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.point = [x, y];
    this.emoji = emoji;
  }

  isValid(): boolean {
    return true;
  }

  drag(x: number, y: number) {
    this.point = [x, y];
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.point[0], this.point[1]);
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

class StickerPreview {
  private point: [number, number];
  private emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.point = [x, y];
    this.emoji = emoji;
  }

  update(x: number, y: number) {
    this.point = [x, y];
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.point[0], this.point[1]);
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
const displayList: (DrawCommand | StickerCommand)[] = [];
const undoStack: (DrawCommand | StickerCommand)[] = [];
let currentCmd: DrawCommand | StickerCommand | null = null;
let toolPreview: ToolPreview | StickerPreview | null = null;

//set base drawing thickness
let selectedThickness: number = 2;

let selectedSticker: string | null = null;
const stickers = [
  { emoji: "🍄", label: "Mushroom" },
  { emoji: "🌿", label: "Fern" },
  { emoji: "🦋", label: "Butterfly" },
  { emoji: "🪵", label: "Log" },
  { emoji: "🍀", label: "Clover" },
  { emoji: "💧", label: "Droplet" },
  { emoji: "🌟", label: "Star" },
  { emoji: "🍃", label: "Leaf" },
];
const stickerPallette = document.createElement("div");
stickerPallette.id = "sticker-pallette";
document.body.appendChild(stickerPallette);

//make our redraw function
function redraw() {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  displayList.forEach((command) => command.display(ctx));
  toolPreview?.display(ctx);
  currentCmd?.display(ctx);
}

//add our drawing event listeners for mouse down and up
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  isDrawing = true;

  if (selectedSticker) {
    currentCmd = new StickerCommand(x, y, selectedSticker);
  } else {
    currentCmd = new DrawCommand(x, y, selectedThickness);
  }

  currentCmd?.drag(x, y);
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
    currentCmd?.drag(x, y);
    redraw();
  }
});

canvas.addEventListener("tool-moved", (e) => {
  const { x, y } = (e as CustomEvent).detail;

  if (selectedSticker) {
    toolPreview = new StickerPreview(x, y, selectedSticker);
  } else {
    toolPreview = new ToolPreview(x, y, selectedThickness);
  }
  redraw();
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentCmd) {
    if (currentCmd && currentCmd.isValid()) {
      displayList.push(currentCmd);
    }
    currentCmd = null;
  }
  isDrawing = false;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mouseout", () => {
  if (isDrawing && currentCmd) {
    if (currentCmd.isValid()) {
      displayList.push(currentCmd);
    }
    currentCmd = null;
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
thinBtn.classList.add("tool-button");
thinBtn.addEventListener("click", () => {
  selectedThickness = 2;
  selectedSticker = null;
  document.querySelectorAll(".tool-button").forEach((btn) => {
    btn.classList.remove("selected");
  });
  thinBtn.classList.add("selected");
});

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick Stroke";
thickBtn.classList.add("tool-button");
thickBtn.addEventListener("click", () => {
  selectedThickness = 8;
  selectedSticker = null;
  document.querySelectorAll(".tool-button").forEach((btn) => {
    btn.classList.remove("selected");
  });
  thickBtn.classList.add("selected");
});

toolsDiv.appendChild(thinBtn);
toolsDiv.appendChild(thickBtn);
document.body.appendChild(toolsDiv);

thinBtn.classList.add("selected");

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
  undoStack.length = 0;
  //placedStickers.length = 0;
  currentCmd = null;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});
document.body.appendChild(clearButton); //add that button to the screen

/*
//make sticker button
stickers.forEach((sticker) => {
  const emojiSticker = document.createElement("button");
  emojiSticker.textContent = sticker;
  emojiSticker.classList.add("sticker-button");
  emojiSticker.classList.add("tool-button");
  emojiSticker.addEventListener("click", () => {
    selectedSticker = sticker;
    document.querySelectorAll(".tool-button").forEach((btn) => {
      btn.classList.remove("selected");
    });
    emojiSticker.classList.add("selected");
  });
  stickerPallette.appendChild(emojiSticker);
});
*/

//building sticker buttons from sticker array
function createStickerButtons() {
  stickerPallette.innerHTML = "";
  stickers.forEach((preset) => {
    const btn = document.createElement("button");
    btn.textContent = preset.emoji;
    btn.title = preset.label;
    btn.classList.add("sticker-button", "tool-button");

    btn.addEventListener("click", () => {
      selectedSticker = preset.emoji;
      document.querySelectorAll(".tool-button").forEach((b) => {
        b.classList.remove("selected");
      });
      btn.classList.add("selected");
    });
    stickerPallette.appendChild(btn);
  });
}
createStickerButtons();

//custom stickers
const customStickerDiv = document.createElement("div");
customStickerDiv.textContent = "Add Sticker: ";

const stickerInput = document.createElement("input");
stickerInput.type = "text";
stickerInput.placeholder = "e.g. 🦌";
stickerInput.maxLength = 5;

const addStickerBtn = document.createElement("button");
addStickerBtn.textContent = "Add";

customStickerDiv.appendChild(stickerInput);
customStickerDiv.appendChild(addStickerBtn);
document.body.appendChild(customStickerDiv);

addStickerBtn.addEventListener("click", () => {
  const newEmoji = stickerInput.value.trim();
  if (!newEmoji) return;

  const newStickerBtn = document.createElement("button");
  newStickerBtn.textContent = newEmoji;
  newStickerBtn.classList.add("sticker-button", "tool-button");
  newStickerBtn.addEventListener("click", () => {
    selectedSticker = newEmoji;
    document.querySelectorAll(".tool-button").forEach((btn) => {
      btn.classList.remove("selected");
    });
    newStickerBtn.classList.add("selected");
  });

  stickerPallette.appendChild(newStickerBtn);
  stickers.push({ emoji: newEmoji, label: "Custom" });

  stickerInput.value = "";
});

function exportDrawing() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.scale(4, 4);

  displayList.forEach((command) => {
    if (command instanceof DrawCommand) {
      command.display(ctx);
    } else if (command instanceof StickerCommand) {
      command.display(ctx);
    }
  });

  ctx.restore();

  const pngDataUrl = exportCanvas.toDataURL("image/png");

  const downloadLink = document.createElement("a");
  downloadLink.href = pngDataUrl;
  downloadLink.download = "sketchpad.png";
}

const exportBtn = document.createElement("button");
exportBtn.textContent = "Export (HD)";
exportBtn.addEventListener("click", exportDrawing);
document.body.appendChild(exportBtn);

//stickers now show on notepad
//const placedStickers: Array<{ x: number; y: number; emoji: string }> = [];

canvas.addEventListener("drawing-changed", redraw);
