const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const target = path.join(root, "js", "firebase-config.js");
const example = path.join(root, "js", "firebase-config.example.js");

if (!fs.existsSync(target) && fs.existsSync(example)) {
  fs.copyFileSync(example, target);
  console.log("Creado js/firebase-config.js desde la plantilla. Completá con tu firebaseConfig.");
} else if (fs.existsSync(target)) {
  console.log("js/firebase-config.js ya existe.");
} else {
  console.error("No se encontró js/firebase-config.example.js");
  process.exit(1);
}
