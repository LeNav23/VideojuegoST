const testButton = document.getElementById("btn-test");
const statusText = document.getElementById("status");

if (testButton && statusText) {
  testButton.addEventListener("click", () => {
    statusText.textContent = "Funciona: JavaScript conectado correctamente.";
  });
}
