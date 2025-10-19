import "./style.css";

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
const displayList: Array<Array<[number, number]>> = [];
const undoStack: Array<Array<[number, number]>> = [];
let currentLine: Array<[number, number]> | null = null;
//let selectedSticker: string | null = null;
const stickers = ["🍄", "🌿", "🦋", "🪵", "🍀", "💧", "🌟", "🍃"];
const stickerPallette = document.createElement("div");
stickerPallette.id = "sticker-pallette";
document.body.appendChild(stickerPallette);

//make our redraw function
function redraw() {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  //styling the line
  if (ctx) {
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
  }

  ctx?.clearRect(0, 0, canvas.width, canvas.height);

  displayList.forEach((line) => {
    if (line.length === 0) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(line[0]![0], line[0]![1]);

    for (let i = 1; i < line.length; i++) {
      ctx.lineTo(line[i]![0], line[i]![1]);
    }
    ctx.stroke();
  });

  if (currentLine && currentLine.length > 1) {
    ctx.beginPath();
    ctx.moveTo(currentLine[0]![0], currentLine[0]![1]);

    for (let i = 1; i < currentLine.length; i++) {
      ctx.lineTo(currentLine[i]![0], currentLine[i]![1]);
    }
    ctx.stroke();
  }
}

//add our drawing event listeners for mouse down and up
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = [];
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentLine.push([x, y]);
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentLine?.push([x, y]);

  redraw();
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentLine) {
    if (currentLine.length > 0) {
      displayList.push(currentLine);
    }
    currentLine = null;
  }
  isDrawing = false;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mouseout", () => {
  if (isDrawing && currentLine) {
    if (currentLine.length > 0) {
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
  currentLine = null;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});
document.body.appendChild(clearButton); //add that button to the screen

//make sticker button
stickers.forEach((sticker) => {
  const emojiSticker = document.createElement("button");
  emojiSticker.textContent = sticker;
  emojiSticker.classList.add("sticker-button");
  emojiSticker.addEventListener("click", () => {
    //selectedSticker = sticker;
    document.querySelectorAll(".sticker-button").forEach((btn) => {
      btn.classList.remove("selected");
    });
    emojiSticker.classList.add("selected");
  });
  stickerPallette.appendChild(emojiSticker);
});

canvas.addEventListener("drawing-changed", redraw);
