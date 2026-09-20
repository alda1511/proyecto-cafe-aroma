document.addEventListener("DOMContentLoaded", function() {
    const titulo = document.getElementById("mensaje-bienvenida");
    const horaActual = new Date().getHours();
    
    if (titulo && horaActual >= 6 && horaActual < 12) {
        titulo.textContent = "¡Buenos días! Bienvenidos a Café Aroma";
    } else if (titulo && horaActual >= 12 && horaActual < 19) {
        titulo.textContent = "¡Buenas tardes! Bienvenidos a Café Aroma";
    } else if (titulo) {
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
// Productos se carga por separado desde productos.js.

//SECCION NOSOTROS//

document.addEventListener("DOMContentLoaded", () => {

    const btnNosotros = document.getElementById("btn-nosotros");
    const textoExtra = document.getElementById("texto-extra-nosotros");

    if (btnNosotros !== null && textoExtra !== null) {
        btnNosotros.addEventListener("click", () => {
            textoExtra.classList.toggle("d-none");
            if (textoExtra.classList.contains("d-none")) {
                btnNosotros.textContent = "Conocé más sobre nosotros";
            } else {
                btnNosotros.textContent = "Mostrar menos";
            }
        });
    }

    const valores = document.querySelectorAll(".valor-nosotros");
    const descripcionValor = document.getElementById("descripcion-valor");

    if (valores.length > 0 && descripcionValor !== null) {
        valores.forEach((valor) => {
            valor.addEventListener("click", () => {
                descripcionValor.textContent = valor.dataset.descripcion;
                valores.forEach((item) => {
                    item.classList.remove("active");
                });
                valor.classList.add("active");
            });
        });
    }
});

//SECCION SERVICIOS//
function mostrarInfo(numero) {
        let informacion = document.getElementById("info" + numero);

        if (!informacion) return;

        if (informacion.style.display === "none") {
            informacion.style.display = "block";
        } else {
            informacion.style.display = "none";
        }
    }

//SECCION CONTACTO//
document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("form-contacto");
    const nombre = document.getElementById("nombre");
    const email = document.getElementById("email");
    const motivo = document.getElementById("motivo");
    const mensaje = document.getElementById("mensaje");
    const resultado = document.getElementById("mensaje-formulario");
    const contador = document.getElementById("contador-mensaje");

    if (!formulario || !nombre || !email || !motivo || !mensaje || !resultado || !contador) return;

    mensaje.addEventListener("input", () => {
        contador.textContent = `${mensaje.value.length}/${mensaje.maxLength} caracteres`;
    });

    motivo.addEventListener("change", () => {
        const textos = {
            consulta: "Escribí tu consulta...",
            pedido: "Contanos qué productos te gustaría pedir...",
            evento: "Contanos qué tipo de evento querés realizar...",
            otro: "Escribí tu mensaje..."
        };
        mensaje.placeholder = textos[motivo.value];
    });

    formulario.addEventListener("submit", (event) => {
        event.preventDefault();
        [nombre, email, mensaje].forEach(campo => {
            campo.classList.remove("is-invalid", "is-valid");
        });

        let valido = true;

        if (nombre.value.trim() === "") {
            nombre.classList.add("is-invalid");
            valido = false;
        } else {
            nombre.classList.add("is-valid");
        }
        if (!email.validity.valid) {
            email.classList.add("is-invalid");
            valido = false;
        } else {
            email.classList.add("is-valid");
        }
        if (mensaje.value.trim() === "") {
            mensaje.classList.add("is-invalid");
            valido = false;
        } else {
            mensaje.classList.add("is-valid");
        }
        if (!valido) {
            resultado.textContent =
                "Por favor, completá correctamente los campos obligatorios.";

            resultado.className = "alert alert-danger mt-3";
            return;
        }
        resultado.textContent =
            `¡Gracias ${nombre.value.trim()}! Tu mensaje es válido. Esta demo no realiza envíos.`;

        resultado.className = "alert alert-success mt-3";
        // Conservamos el mensaje: no hubo un envío real.
    });
});