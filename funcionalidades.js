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
// SECCION PRODUCTOS//
document.addEventListener("DOMContentLoaded", () => {
    const seleccionar = (selector) => document.querySelector(selector);
    const CLAVE = "carritoCafeAroma";

    const lista = seleccionar("#lista-carrito");
    const cantidad = seleccionar("#cantidad-carrito");
    const total = seleccionar("#total-carrito");
    const avisoVacio = seleccionar("#carrito-vacio");
    const botonVaciar = seleccionar("#vaciar-carrito");
    const botonFinalizar = seleccionar("#finalizar-carrito");

    let carrito = JSON.parse(localStorage.getItem(CLAVE)) || [];

    const formatearPrecio = (precio) =>
        precio.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
        });

    const guardarCarrito = () => {
        localStorage.setItem(CLAVE, JSON.stringify(carrito));
    };

    const actualizarCarrito = () => {
        lista.innerHTML = carrito
            .map(
                (producto, indice) => `
                    <div class="list-group-item d-flex flex-column flex-md-row
                        justify-content-between align-items-md-center gap-3">

                        <div>
                            <strong>${producto.nombre}</strong>

                            <small class="d-block text-secondary">
                                ${formatearPrecio(producto.precio)} cada uno
                            </small>
                        </div>

                        <div class="d-flex align-items-center gap-2">

                            <button
                                class="btn btn-sm btn-outline-secondary"
                                data-accion="restar"
                                data-indice="${indice}"
                            >
                                −
                            </button>

                            <span class="fw-bold">
                                ${producto.cantidad}
                            </span>

                            <button
                                class="btn btn-sm btn-outline-secondary"
                                data-accion="sumar"
                                data-indice="${indice}"
                            >
                                +
                            </button>

                            <strong class="ms-2">
                                ${formatearPrecio(
                                    producto.precio * producto.cantidad
                                )}
                            </strong>

                            <button
                                class="btn btn-sm btn-outline-danger"
                                data-accion="eliminar"
                                data-indice="${indice}"
                            >
                                ×
                            </button>

                        </div>
                    </div>
                `
            )
            .join("");

        const cantidadTotal = carrito.reduce(
            (suma, producto) => suma + producto.cantidad,
            0
        );

        const precioTotal = carrito.reduce(
            (suma, producto) =>
                suma + producto.precio * producto.cantidad,
            0
        );

        cantidad.textContent = cantidadTotal;
        total.textContent = formatearPrecio(precioTotal);

        avisoVacio.classList.toggle(
            "d-none",
            carrito.length > 0
        );

        botonVaciar.disabled = carrito.length === 0;
        botonFinalizar.disabled = carrito.length === 0;

        guardarCarrito();
    };

    const agregarProducto = (nombre, precio) => {
        const producto = carrito.find(
            (item) => item.nombre === nombre
        );

        producto
            ? producto.cantidad++
            : carrito.push({
                nombre,
                precio,
                cantidad: 1
            });

        actualizarCarrito();
    };

    /*
        Agrega automáticamente los botones a las tarjetas.
    */

    document
        .querySelectorAll("#productos .card")
        .forEach((tarjeta) => {
            const cuerpo = tarjeta.querySelector(".card-body");
            const titulo = tarjeta.querySelector("h3");
            const precio = tarjeta.querySelector(
                ".fw-bold.fs-5.mb-0"
            );

            if (!cuerpo || !titulo || !precio) {
                return;
            }

            const boton = document.createElement("button");

            boton.type = "button";
            boton.className =
                "btn btn-dark mt-3 btn-agregar-carrito";

            boton.textContent = "Agregar al pedido";

            boton.addEventListener("click", () => {
                agregarProducto(
                    titulo.textContent.trim(),
                    Number(precio.textContent.replace(/\D/g, ""))
                );

                boton.textContent = "Agregado ✓";

                setTimeout(() => {
                    boton.textContent = "Agregar al pedido";
                }, 800);
            });

            cuerpo.appendChild(boton);
        });

    /*
        Sumar, restar y eliminar productos.
    */

    lista.addEventListener("click", (evento) => {
        const boton = evento.target.closest(
            "button[data-accion]"
        );

        if (!boton) {
            return;
        }

        const indice = Number(boton.dataset.indice);
        const accion = boton.dataset.accion;

        if (accion === "sumar") {
            carrito[indice].cantidad++;
        }

        if (accion === "restar") {
            carrito[indice].cantidad--;
        }

        if (
            accion === "eliminar" ||
            carrito[indice].cantidad === 0
        ) {
            carrito.splice(indice, 1);
        }

        actualizarCarrito();
    });

    /*
        Vaciar el carrito.
    */

    botonVaciar.addEventListener("click", () => {
        carrito = [];
        actualizarCarrito();
    });

    /*
        Pasar el pedido al formulario.
    */

    botonFinalizar.addEventListener("click", () => {
        const detalle = carrito
            .map(
                (producto) =>
                    `${producto.nombre} x${producto.cantidad}`
            )
            .join(", ");

        const precioTotal = carrito.reduce(
            (suma, producto) =>
                suma + producto.precio * producto.cantidad,
            0
        );

        const motivo = seleccionar("#motivo");
        const mensaje = seleccionar("#mensaje");

        if (motivo && mensaje) {
            motivo.value = "pedido";

            mensaje.value =
                `Hola, quiero pedir para llevar: ${detalle}. ` +
                `Total estimado: ${formatearPrecio(precioTotal)}.`;
        }

        bootstrap.Modal
            .getOrCreateInstance(
                seleccionar("#modalCarrito")
            )
            .hide();

        seleccionar("#contacto")?.scrollIntoView({
            behavior: "smooth"
        });

        seleccionar("#nombre")?.focus();
    });

    actualizarCarrito();
});
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

//SECCION CONTACTO//
document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("form-contacto");
    const nombre = document.getElementById("nombre");
    const email = document.getElementById("email");
    const motivo = document.getElementById("motivo");
    const mensaje = document.getElementById("mensaje");
    const resultado = document.getElementById("mensaje-formulario");
    const contador = document.getElementById("contador-mensaje");

    mensaje.addEventListener("input", () => {
        contador.textContent = `${mensaje.value.length}/500 caracteres`;
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
            `¡Gracias ${nombre.value.trim()}! Recibimos tu mensaje.`;

        resultado.className = "alert alert-success mt-3";
        formulario.reset();
        contador.textContent = "0/500 caracteres";
    });
});
