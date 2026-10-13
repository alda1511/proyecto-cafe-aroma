// El carrito se borra al recargar la página. No se envían pedidos al local.
const carrito = [];
const lista = document.getElementById('lista-carrito');
const totalPedido = document.getElementById('total-pedido');
const aviso = document.getElementById('aviso');

// 1. Agregar un producto al presionar su botón.
document.querySelectorAll('.agregar').forEach(function (boton) {
    boton.onclick = function () {
        const nombre = boton.dataset.nombre;
        const precio = Number(boton.dataset.precio);
        const producto = carrito.find(function (item) { return item.nombre === nombre; });
        if (producto) producto.cantidad++;
        else carrito.push({ nombre: nombre, precio: precio, cantidad: 1 });
        mostrarCarrito();
        const agregado = carrito.find(function (item) { return item.nombre === nombre; });
        document.getElementById('texto-agregado').textContent = nombre + ' agregado. Cantidad: ' + agregado.cantidad;
        bootstrap.Toast.getOrCreateInstance(document.getElementById('aviso-agregado')).show();
    };
});

// 2. Mostrar los productos y calcular el total.
function mostrarCarrito() {
    lista.innerHTML = '';
    aviso.textContent = '';
    let total = 0;
    let unidades = 0;
    carrito.forEach(function (producto, posicion) {
        total += producto.precio * producto.cantidad;
        unidades += producto.cantidad;
        const fila = document.createElement('tr');
        fila.innerHTML = '<td></td><td><input type="number" min="1" step="1" aria-label="Cantidad" class="form-control" style="width:90px"></td><td></td><td><button type="button" class="btn btn-outline-danger btn-sm">Quitar</button></td>';
        fila.cells[0].textContent = producto.nombre;
        fila.cells[2].textContent = '$ ' + (producto.precio * producto.cantidad).toLocaleString('es-AR');
        const cantidad = fila.querySelector('input');
        cantidad.value = producto.cantidad;
        cantidad.onchange = function () {
            const numero = Number(cantidad.value);
            if (Number.isSafeInteger(numero) && numero > 0) producto.cantidad = numero;
            mostrarCarrito();
        };
        fila.querySelector('button').onclick = function () {
            carrito.splice(posicion, 1);
            mostrarCarrito();
        };
        lista.appendChild(fila);
    });
    document.querySelectorAll('.contador-carrito').forEach(function (contador) {
        contador.textContent = unidades;
    });
    totalPedido.textContent = '$ ' + total.toLocaleString('es-AR');
    document.getElementById('preparar').disabled = carrito.length === 0;
    document.getElementById('vacio').hidden = carrito.length > 0;
}

// 3. Vaciar el carrito.
document.getElementById('vaciar').onclick = function () {
    carrito.length = 0;
    mostrarCarrito();
};

// 4. Pedir número de mesa solamente cuando se consume en el local.
const modalidad = document.getElementById('modalidad');
const mesa = document.getElementById('mesa');
modalidad.onchange = function () {
    mesa.disabled = modalidad.value === 'llevar';
    mesa.required = modalidad.value === 'local';
};

// 5. Validar el formulario y mostrar un aviso, sin enviar información.
document.getElementById('form-pedido').onsubmit = function (evento) {
    evento.preventDefault();
    if (carrito.length === 0) return;
    aviso.textContent = 'Pedido de prueba preparado. No se envió información al local.';
};
mostrarCarrito();
