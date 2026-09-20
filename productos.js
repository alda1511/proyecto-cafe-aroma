/* TP4 · Productos. El HTML es la fuente del catálogo; guardamos solo ID y cantidad. */
document.addEventListener('DOMContentLoaded', () => {
    const seccion = document.querySelector('#productos');
    if (!seccion) return;

    const obtener = (id) => document.getElementById(id);
    const grilla = obtener('catalogo-productos');
    const tarjetas = [...grilla.querySelectorAll('[data-producto]')];
    const catalogo = tarjetas.map((tarjeta) => ({
        id: tarjeta.dataset.producto,
        nombre: tarjeta.dataset.nombre,
        categoria: tarjeta.dataset.categoria,
        precio: Number(tarjeta.dataset.precio),
        desde: tarjeta.dataset.desde === 'true',
        tarjeta
    }));
    const buscar = obtener('buscar-producto');
    const orden = obtener('orden-productos');
    const filtros = obtener('filtros-productos');
    const lista = obtener('lista-carrito');
    const modal = obtener('modalCarrito');
    const CLAVE = 'cafeAroma.pedido.v2';
    const CLAVE_PREPARACION = 'cafeAroma.enPreparacion.v1';
    const LIMITE = 20; // Límite por producto para esta demo; no representa stock.
    const precio = (valor) => valor.toLocaleString('es-AR', {
        style: 'currency', currency: 'ARS', maximumFractionDigits: 0
    });
    const normalizar = (texto) => texto.toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').trim();
    let categoria = 'todos';
    let pagina = 1;
    const POR_PAGINA = 12;
    let carrito = [];
    let pedidoEnCurso = null;
    let temporizador;

    function avisar(texto) {
        const aviso = obtener('aviso-productos');
        clearTimeout(temporizador);
        aviso.textContent = texto;
        aviso.classList.add('visible');
        temporizador = setTimeout(() => aviso.classList.remove('visible'), 3500);
    }

    // localStorage puede estar bloqueado o contener datos inválidos.
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE) || '[]');
        if (Array.isArray(guardado)) {
            carrito = guardado.filter((item, indice, items) =>
                item && catalogo.some((p) => p.id === item.id) &&
                Number.isInteger(item.cantidad) && item.cantidad > 0 &&
                item.cantidad <= LIMITE &&
                items.findIndex((otro) => otro?.id === item.id) === indice
            ).map(({ id, cantidad }) => ({ id, cantidad }));
        }
    } catch {
        avisar('Tu pedido empieza vacío. No pudimos recuperar los datos guardados.');
    }

    // Recuperar el estado local evita confirmar dos veces tras una recarga.
    try {
        const pedido = JSON.parse(localStorage.getItem(CLAVE_PREPARACION) || 'null');
        // Los pedidos de la versión anterior eran siempre para consumir en el local.
        const modalidad = pedido?.modalidad === undefined ? 'local' : pedido.modalidad;
        const destinoValido = pedido && (
            (modalidad === 'local' && Number.isInteger(pedido.mesa) && pedido.mesa >= 1 && pedido.mesa <= 99) ||
            (modalidad === 'llevar' && pedido.mesa === null)
        );
        if (destinoValido &&
            typeof pedido.codigo === 'string' && /^CA-[A-Z0-9]{6,15}$/.test(pedido.codigo) &&
            typeof pedido.notas === 'string' && pedido.notas.length <= 250 &&
            Array.isArray(pedido.items) && pedido.items.length > 0 &&
            pedido.items.every((item, indice, items) => item &&
                catalogo.some((p) => p.id === item.id) &&
                Number.isInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= LIMITE &&
                items.findIndex((otro) => otro?.id === item.id) === indice)) {
            pedidoEnCurso = { ...pedido, modalidad };
            carrito = pedido.items.map(({ id, cantidad }) => ({ id, cantidad }));
        }
    } catch {
        avisar('No pudimos recuperar el estado del pedido anterior.');
    }

    // Combina búsqueda y categoría; append mueve los nodos, no duplica tarjetas.
    function filtrarProductos() {
        const texto = normalizar(buscar.value);
        const productos = [...catalogo];
        if (orden.value === 'menor') productos.sort((a, b) => a.precio - b.precio);
        if (orden.value === 'mayor') productos.sort((a, b) => b.precio - a.precio);
        if (orden.value === 'nombre') productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        const coincidencias = productos.filter((producto) =>
            (categoria === 'todos' || producto.categoria === categoria) &&
            normalizar(producto.nombre + ' ' + producto.tarjeta.querySelector('.card-text').textContent).includes(texto));
        const paginas = Math.max(1, Math.ceil(coincidencias.length / POR_PAGINA));
        pagina = Math.min(pagina, paginas);
        const visibles = coincidencias.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
        productos.forEach((producto) => {
            producto.tarjeta.classList.toggle('d-none', !visibles.includes(producto));
            grilla.append(producto.tarjeta);
        });
        obtener('resultado-productos').textContent = `${coincidencias.length} de ${catalogo.length} productos · precios en ARS`;
        obtener('sin-productos').classList.toggle('d-none', coincidencias.length > 0);
        obtener('pagina-actual').textContent = `Página ${pagina} de ${paginas}`;
        obtener('pagina-anterior').disabled = pagina === 1;
        obtener('pagina-siguiente').disabled = pagina === paginas;
        obtener('paginacion-productos').classList.toggle('d-none', paginas === 1);
        filtros.querySelectorAll('button').forEach((boton) => {
            const activo = boton.dataset.categoria === categoria;
            boton.classList.toggle('active', activo);
            boton.setAttribute('aria-pressed', String(activo));
        });
    }

    const calcularTotal = () => carrito.reduce((suma, item) =>
        suma + catalogo.find((p) => p.id === item.id).precio * item.cantidad, 0);

    function actualizarCarrito() {
        // Nunca insertamos texto recuperado de localStorage como HTML.
        lista.replaceChildren();
        carrito.forEach((item) => {
            const producto = catalogo.find((p) => p.id === item.id);
            const fila = document.createElement('div');
            fila.className = 'list-group-item py-3 d-flex flex-wrap justify-content-between align-items-center gap-3';
            const descripcion = document.createElement('div');
            const nombre = document.createElement('strong');
            nombre.textContent = producto.nombre;
            const detalle = document.createElement('small');
            detalle.className = 'd-block text-secondary';
            detalle.textContent = `${producto.desde ? 'Desde ' : ''}${precio(producto.precio)} por unidad`;
            descripcion.append(nombre, detalle);
            const controles = document.createElement('div');
            controles.className = 'd-flex flex-wrap align-items-center gap-2';
            const crearBoton = (accion, texto, etiqueta) => {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'btn btn-sm btn-outline-secondary';
                boton.dataset.accion = accion;
                boton.dataset.id = item.id;
                boton.textContent = texto;
                boton.setAttribute('aria-label', `${etiqueta} ${producto.nombre}`);
                if (accion === 'sumar') boton.disabled = item.cantidad >= LIMITE;
                return boton;
            };
            const unidades = document.createElement('span');
            unidades.className = 'fw-bold px-1';
            unidades.textContent = String(item.cantidad);
            const subtotal = document.createElement('strong');
            subtotal.className = 'mx-2';
            subtotal.textContent = precio(producto.precio * item.cantidad);
            controles.append(crearBoton('restar', '−', 'Restar una unidad de'), unidades,
                crearBoton('sumar', '+', 'Sumar una unidad de'), subtotal,
                crearBoton('eliminar', 'Quitar', 'Quitar'));
            fila.append(descripcion, controles);
            lista.append(fila);
        });
        const cantidad = carrito.reduce((suma, item) => suma + item.cantidad, 0);
        obtener('cantidad-carrito').textContent = String(cantidad);
        obtener('cantidad-productos').textContent = String(cantidad);
        obtener('btn-abrir-carrito').setAttribute('aria-label', `Abrir mi pedido: ${cantidad} unidades`);
        obtener('total-carrito').textContent = precio(calcularTotal());
        obtener('total-resumen').textContent = precio(calcularTotal());
        obtener('carrito-vacio').classList.toggle('d-none', cantidad > 0);
        obtener('vaciar-carrito').disabled = cantidad === 0;
        obtener('finalizar-carrito').disabled = cantidad === 0 || pedidoEnCurso !== null;
        try {
            localStorage.setItem(CLAVE, JSON.stringify(carrito));
        } catch {
            obtener('aviso-carrito').textContent = 'El pedido funciona, pero no se conservará al cerrar o recargar esta página.';
        }
    }

    buscar.addEventListener('input', () => { pagina = 1; filtrarProductos(); });
    orden.addEventListener('change', () => { pagina = 1; filtrarProductos(); });
    ['anterior', 'siguiente'].forEach((direccion) => {
        obtener(`pagina-${direccion}`).addEventListener('click', () => {
            pagina += direccion === 'siguiente' ? 1 : -1;
            filtrarProductos();
            buscar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            buscar.focus({ preventScroll: true });
        });
    });
    filtros.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-categoria]');
        if (!boton) return;
        categoria = boton.dataset.categoria;
        pagina = 1;
        filtrarProductos();
    });
    obtener('limpiar-filtros').addEventListener('click', () => {
        buscar.value = '';
        pagina = 1;
        categoria = 'todos';
        orden.value = 'original';
        filtrarProductos();
        buscar.focus();
    });
    // Delegación en toda la sección: carta y carrusel agregan al mismo carrito.
    seccion.addEventListener('click', (evento) => {
        if (pedidoEnCurso) return;
        const boton = evento.target.closest('[data-agregar]');
        if (!boton) return;
        const producto = catalogo.find((p) => p.id === boton.dataset.agregar);
        if (!producto) return;
        const item = carrito.find((p) => p.id === producto.id);
        if (item?.cantidad >= LIMITE) {
            avisar(`Podés agregar hasta ${LIMITE} unidades por producto.`);
            return;
        }
        if (item) item.cantidad++;
        else carrito.push({ id: producto.id, cantidad: 1 });
        actualizarCarrito();
        avisar(`${producto.nombre} se agregó a tu pedido.`);
    });
    // Delegación: un listener atiende todos los controles del carrito.
    lista.addEventListener('click', (evento) => {
        if (pedidoEnCurso) return;
        const boton = evento.target.closest('button[data-accion]');
        if (!boton) return;
        const indice = carrito.findIndex((p) => p.id === boton.dataset.id);
        if (indice < 0) return;
        const item = carrito[indice];
        if (boton.dataset.accion === 'sumar' && item.cantidad < LIMITE) item.cantidad++;
        if (boton.dataset.accion === 'restar') item.cantidad--;
        if (boton.dataset.accion === 'eliminar' || item.cantidad === 0) carrito.splice(indice, 1);
        actualizarCarrito();
        // Recuperar el foco después de reconstruir los controles.
        const siguiente = [...lista.querySelectorAll('button')].find((b) =>
            b.dataset.id === boton.dataset.id && b.dataset.accion === boton.dataset.accion && !b.disabled);
        (siguiente || lista.querySelector('button') || modal.querySelector('.btn-close')).focus();
    });
    obtener('vaciar-carrito').addEventListener('click', () => {
        if (pedidoEnCurso) return;
        carrito = [];
        actualizarCarrito();
        modal.querySelector('.btn-close').focus();
    });
    // Alternar edición y preparación sin salir del carrito ni tocar Contacto.
    function mostrarEstadoPedido() {
        const preparando = pedidoEnCurso !== null;
        obtener('edicion-pedido').classList.toggle('d-none', preparando);
        obtener('acciones-carrito').classList.toggle('d-none', preparando);
        obtener('pedido-preparacion').classList.toggle('d-none', !preparando);
        obtener('acciones-preparacion').classList.toggle('d-none', !preparando);
        obtener('aviso-pedido-en-curso').classList.toggle('d-none', !preparando);
        obtener('texto-carrito').textContent = preparando ? 'En preparación' : 'Mi pedido';
        obtener('tituloModalCarrito').textContent = preparando ? 'Estado de tu pedido' : 'Tu pedido';
        seccion.querySelectorAll('[data-agregar]').forEach((boton) => {
            boton.disabled = preparando;
        });
        if (!preparando) return;

        const destino = pedidoEnCurso.modalidad === 'llevar'
            ? 'Para llevar'
            : `En el local · Mesa ${pedidoEnCurso.mesa}`;
        obtener('alerta-pedido').textContent = `¡Pedido registrado! ${destino}: tu pedido está en preparación.`;
        obtener('mesa-preparacion').textContent = destino;
        obtener('destino-resumen').textContent = destino;
        obtener('texto-pedido-en-curso').textContent = `Pedido en preparación · ${destino}. Podés ver el estado o iniciar otro pedido desde el carrito.`;
        obtener('numero-pedido').textContent = `Pedido ${pedidoEnCurso.codigo}`;
        obtener('btn-abrir-carrito').setAttribute('aria-label', `Ver pedido: ${destino}, en preparación`);
        const resumen = obtener('resumen-preparacion');
        resumen.replaceChildren();
        pedidoEnCurso.items.forEach((item) => {
            const producto = catalogo.find((p) => p.id === item.id);
            const fila = document.createElement('li');
            const detalle = document.createElement('span');
            const subtotal = document.createElement('strong');
            detalle.textContent = `${item.cantidad} × ${producto.nombre}`;
            subtotal.textContent = precio(producto.precio * item.cantidad);
            fila.append(detalle, subtotal);
            resumen.append(fila);
        });
        obtener('total-preparacion').textContent = precio(calcularTotal());
        obtener('notas-preparacion').textContent = `Observaciones: ${pedidoEnCurso.notas}`;
        obtener('notas-preparacion').classList.toggle('d-none', !pedidoEnCurso.notas);
    }

    const formularioPedido = obtener('datos-pedido');
    const mesa = obtener('numero-mesa');
    const modalidades = formularioPedido.querySelectorAll('[name="modalidad"]');
    function actualizarModalidad() {
        const paraLlevar = obtener('modalidad-llevar').checked;
        obtener('grupo-mesa').classList.toggle('d-none', paraLlevar);
        mesa.disabled = paraLlevar;
        mesa.required = !paraLlevar;
        mesa.classList.remove('is-invalid');
        mesa.removeAttribute('aria-invalid');
    }
    modalidades.forEach((opcion) => opcion.addEventListener('change', actualizarModalidad));
    mesa.addEventListener('input', () => {
        mesa.classList.remove('is-invalid');
        mesa.removeAttribute('aria-invalid');
    });
    formularioPedido.addEventListener('submit', (evento) => {
        evento.preventDefault();
        // Este control también evita dobles clics y envíos con Enter repetidos.
        if (!carrito.length || pedidoEnCurso) return;
        const modalidad = formularioPedido.querySelector('[name="modalidad"]:checked')?.value;
        if (!['local', 'llevar'].includes(modalidad)) {
            formularioPedido.reportValidity();
            return;
        }
        const numeroMesa = modalidad === 'local' ? Number(mesa.value) : null;
        if (modalidad === 'local' && (!Number.isInteger(numeroMesa) || numeroMesa < 1 || numeroMesa > 99 || !mesa.validity.valid)) {
            mesa.classList.add('is-invalid');
            mesa.setAttribute('aria-invalid', 'true');
            mesa.focus();
            return;
        }
        if (!formularioPedido.reportValidity()) return;
        pedidoEnCurso = {
            codigo: `CA-${Date.now().toString(36).toUpperCase()}`,
            modalidad,
            mesa: numeroMesa,
            notas: obtener('notas-pedido').value.trim().slice(0, 250),
            items: carrito.map(({ id, cantidad }) => ({ id, cantidad }))
        };
        actualizarCarrito();
        mostrarEstadoPedido();
        try {
            localStorage.setItem(CLAVE_PREPARACION, JSON.stringify(pedidoEnCurso));
        } catch {
            obtener('aviso-carrito').textContent = 'El estado se muestra en esta sesión, pero no pudimos guardarlo para una recarga.';
        }
        obtener('titulo-preparacion').focus();
    });

    obtener('nuevo-pedido').addEventListener('click', () => {
        pedidoEnCurso = null;
        carrito = [];
        formularioPedido.reset();
        actualizarModalidad();
        mesa.classList.remove('is-invalid');
        mesa.removeAttribute('aria-invalid');
        obtener('aviso-carrito').textContent = '';
        actualizarCarrito();
        mostrarEstadoPedido();
        try {
            localStorage.removeItem(CLAVE_PREPARACION);
        } catch {
            obtener('aviso-carrito').textContent = 'No pudimos borrar el estado guardado. Si recargás, podría reaparecer el pedido anterior.';
        }
        obtener('modalidad-local').focus();
    });

    // Bootstrap controla la apertura; actualizamos el texto y el foco.
    const carta = obtener('carta-productos');
    const botonCarta = obtener('btn-ver-carta');
    carta.addEventListener('show.bs.collapse', () => {
        botonCarta.textContent = 'Ocultar carta';
    });
    carta.addEventListener('shown.bs.collapse', () => {
        buscar.focus({ preventScroll: true });
        carta.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    carta.addEventListener('hide.bs.collapse', () => {
        if (carta.contains(document.activeElement)) botonCarta.focus();
    });
    carta.addEventListener('hidden.bs.collapse', () => {
        botonCarta.textContent = 'Ver carta y armar pedido';
    });
    obtener('promos-productos').addEventListener('slid.bs.carousel', (evento) => {
        obtener('estado-promos').textContent = `Promo ${evento.to + 1} de 6`;
    });
    // Los precios del carrusel también se leen del catálogo, evitando diferencias.
    seccion.querySelectorAll('[data-precio-promo]').forEach((etiqueta) => {
        const producto = catalogo.find((p) => p.id === etiqueta.dataset.precioPromo);
        if (producto) etiqueta.textContent = precio(producto.precio);
    });

    actualizarModalidad();
    filtrarProductos();
    actualizarCarrito();
    mostrarEstadoPedido();
});
