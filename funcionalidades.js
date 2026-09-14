document.addEventListener("DOMContentLoaded", function() {
    const titulo = document.getElementById("mensaje-bienvenida");
    const horaActual = new Date().getHours();
    
    if (horaActual >= 6 && horaActual < 12) {
        titulo.textContent = "¡Buenos días! Bienvenidos a Café Aroma";
    } else if (horaActual >= 12 && horaActual < 19) {
        titulo.textContent = "¡Buenas tardes! Bienvenidos a Café Aroma";
    } else {
        titulo.textContent = "¡Buenas noches! Bienvenidos a Café Aroma";
    }

const btnRecomendacion = document.getElementById("btn-recomendacion");
const textoRecomendacion = document.getElementById("texto-recomendacion");

if (btnRecomendacion !== null && textoRecomendacion !== null) {
  
    btnRecomendacion.addEventListener("click", function() {
        const opcionesCafe = [
            "Te recomendamos un clásico: Café Espresso con mucho cariño.",
            "Ideal para hoy: Café con leche y dos medialunas.",
            "Refrescante: Café frío con panificados.",
            "Suave y espumoso: Café Americano con dos medialunas."
        ];
        const numeroAleatorio = Math.floor(Math.random() * opcionesCafe.length);
        textoRecomendacion.textContent = opcionesCafe[numeroAleatorio];
    });
    
}
});