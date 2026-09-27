// TP4: el catálogo vive en el HTML; localStorage guarda únicamente el pedido.
document.addEventListener('DOMContentLoaded', () => {
    const obtener = id => document.getElementById(id);
    const grilla = obtener('catalogo-productos');
    if (!grilla) return;
    // El JSON de carta.html contiene datos; template evita repetir 94 tarjetas.
    const datos = JSON.parse(obtener('datos-catalogo').textContent);
    const catalogo = datos.productos.map(([id, nombre, categoria, precio, descripcion]) => {
        const tarjeta = obtener('plantilla-producto').content.firstElementChild.cloneNode(true);
        tarjeta.dataset.producto = id;
        tarjeta.querySelector('h3').textContent = nombre;
        tarjeta.querySelector('.card-text').textContent = datos.descripciones[descripcion];
        tarjeta.querySelector('.aroma-precio').textContent = precio.toLocaleString('es-AR', {
            style: 'currency', currency: 'ARS', maximumFractionDigits: 0
        });
        const boton = tarjeta.querySelector('button');
        boton.dataset.agregar = id;
        boton.setAttribute('aria-label', `Agregar ${nombre} al pedido`);
        grilla.append(tarjeta);
        return { id, nombre, categoria, precio, tarjeta };
    });
    const buscar = obtener('buscar-producto'), orden = obtener('orden-productos');
    const lista = obtener('lista-carrito'), formulario = obtener('datos-pedido'), mesa = obtener('numero-mesa');
    const CLAVE = 'cafeAroma.pedido.v2', ESTADO = 'cafeAroma.enPreparacion.v1', LIMITE = 20, POR_PAGINA = 12;
    const producto = id => catalogo.find(p => p.id === id);
    const precio = valor => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    const normalizar = texto => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const texto = (id, valor) => { obtener(id).textContent = valor; };
    const ocultar = (id, valor) => obtener(id).classList.toggle('d-none', valor);
    const escuchar = (id, evento, funcion) => obtener(id).addEventListener(evento, funcion);
    let categoria = 'todos', pagina = 1, temporizador;

    // Validar datos guardados evita cantidades inválidas, IDs desconocidos y duplicados.
    const itemValido = (item, indice, items) => item && producto(item.id) &&
        Number.isInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= LIMITE &&
        items.findIndex(otro => otro?.id === item.id) === indice;
    function leer(clave, defecto) {
        try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; }
        catch { return defecto; }
    }
    function guardar(clave, valor) {
        try { localStorage.setItem(clave, JSON.stringify(valor)); }
        catch { texto('aviso-carrito', 'No se pudo guardar. Los cambios podrían perderse al recargar.'); }
    }
    const guardado = leer(CLAVE, []);
    let carrito = Array.isArray(guardado) ? guardado.filter(itemValido).map(({ id, cantidad }) => ({ id, cantidad })) : [];
    let pedido = leer(ESTADO, null);
    const modalidad = pedido?.modalidad ?? 'local';
    const destinoValido = pedido && ((modalidad === 'llevar' && pedido.mesa === null) ||
        (modalidad === 'local' && Number.isInteger(pedido.mesa) && pedido.mesa >= 1 && pedido.mesa <= 99));
    if (destinoValido && /^CA-[A-Z0-9]{6,15}$/.test(pedido.codigo) && typeof pedido.notas === 'string' &&
        pedido.notas.length <= 250 && Array.isArray(pedido.items) && pedido.items.length && pedido.items.every(itemValido)) {
        pedido.modalidad = modalidad;
        carrito = pedido.items.map(({ id, cantidad }) => ({ id, cantidad }));
    } else pedido = null;
    const total = () => carrito.reduce((suma, item) => suma + producto(item.id).precio * item.cantidad, 0);

    // textContent mantiene nombres y observaciones como texto, nunca como código HTML.
    function crear(etiqueta, contenido = '', clase = '') {
        const nodo = document.createElement(etiqueta);
        nodo.textContent = contenido;
        nodo.className = clase;
        return nodo;
    }
    function avisar(mensaje) {
        clearTimeout(temporizador);
        texto('aviso-productos', mensaje);
        obtener('aviso-productos').classList.add('visible');
        temporizador = setTimeout(() => obtener('aviso-productos').classList.remove('visible'), 3500);
    }
    function filtrar() {
        const comparadores = { menor: (a, b) => a.precio - b.precio, mayor: (a, b) => b.precio - a.precio,
            nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es') };
        const productos = [...catalogo];
        if (comparadores[orden.value]) productos.sort(comparadores[orden.value]);
        const coincidencias = productos.filter(p => (categoria === 'todos' || p.categoria === categoria) &&
            normalizar(p.nombre + ' ' + p.tarjeta.querySelector('.card-text').textContent).includes(normalizar(buscar.value)));
        const paginas = Math.max(1, Math.ceil(coincidencias.length / POR_PAGINA));
        pagina = Math.min(pagina, paginas);
        const visibles = coincidencias.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
        productos.forEach(p => { p.tarjeta.classList.toggle('d-none', !visibles.includes(p)); grilla.append(p.tarjeta); });
        texto('resultado-productos', `${coincidencias.length} de ${catalogo.length} productos · precios en ARS`);
        texto('pagina-actual', `Página ${pagina} de ${paginas}`);
        ocultar('sin-productos', coincidencias.length > 0);
        ocultar('paginacion-productos', paginas === 1);
        obtener('pagina-anterior').disabled = pagina === 1;
        obtener('pagina-siguiente').disabled = pagina === paginas;
        obtener('filtros-productos').querySelectorAll('button').forEach(boton => {
            const activo = boton.dataset.categoria === categoria;
            boton.classList.toggle('active', activo);
            boton.setAttribute('aria-pressed', activo);
        });
    }
    function actualizarCarrito() {
        lista.replaceChildren();
        carrito.forEach(item => {
            const p = producto(item.id), descripcion = crear('div');
            const fila = crear('div', '', 'list-group-item py-3 d-flex flex-wrap justify-content-between align-items-center gap-3');
            descripcion.append(crear('strong', p.nombre), crear('small',
                `${p.desde === 'true' ? 'Desde ' : ''}${precio(p.precio)} por unidad`, 'd-block text-secondary'));
            const controles = crear('div', '', 'd-flex flex-wrap align-items-center gap-2');
            const boton = (accion, contenido, etiqueta) => {
                const control = crear('button', contenido, 'btn btn-sm btn-outline-secondary');
                control.type = 'button';
                Object.assign(control.dataset, { accion, id: item.id });
                control.setAttribute('aria-label', `${etiqueta} ${p.nombre}`);
                control.disabled = accion === 'sumar' && item.cantidad >= LIMITE;
                return control;
            };
            controles.append(boton('restar', '−', 'Restar'), crear('span', item.cantidad, 'fw-bold px-1'),
                boton('sumar', '+', 'Sumar'), crear('strong', precio(p.precio * item.cantidad)), boton('eliminar', 'Quitar', 'Quitar'));
            fila.append(descripcion, controles);
            lista.append(fila);
        });
        const cantidad = carrito.reduce((suma, item) => suma + item.cantidad, 0);
        ['cantidad-carrito', 'cantidad-productos'].forEach(id => texto(id, cantidad));
        ['total-carrito', 'total-resumen'].forEach(id => texto(id, precio(total())));
        obtener('btn-abrir-carrito').setAttribute('aria-label', `Abrir pedido: ${cantidad} unidades`);
        ocultar('carrito-vacio', cantidad > 0);
        obtener('vaciar-carrito').disabled = !cantidad;
        obtener('finalizar-carrito').disabled = !cantidad || !!pedido;
        guardar(CLAVE, carrito);
    }
    function mostrarEstado() {
        ['edicion-pedido', 'acciones-carrito'].forEach(id => ocultar(id, !!pedido));
        ['pedido-preparacion', 'acciones-preparacion', 'aviso-pedido-en-curso'].forEach(id => ocultar(id, !pedido));
        texto('texto-carrito', pedido ? 'En preparación' : 'Mi pedido');
        texto('tituloModalCarrito', pedido ? 'Estado de tu pedido' : 'Tu pedido');
        document.querySelectorAll('[data-agregar]').forEach(boton => { boton.disabled = !!pedido; });
        if (!pedido) return;
        const destino = pedido.modalidad === 'llevar' ? 'Para llevar' : `En el local · Mesa ${pedido.mesa}`;
        texto('alerta-pedido', `Demo: ${destino}. Estado simulado: en preparación. No se envió al local.`);
        ['mesa-preparacion', 'destino-resumen'].forEach(id => texto(id, destino));
        texto('texto-pedido-en-curso', `Pedido simulado en preparación · ${destino}. Consultalo desde el carrito.`);
        texto('numero-pedido', `Pedido ${pedido.codigo}`);
        obtener('resumen-preparacion').replaceChildren(...carrito.map(item => {
            const fila = crear('li', '', 'd-flex justify-content-between gap-3 mb-2'), p = producto(item.id);
            fila.append(crear('span', `${item.cantidad} × ${p.nombre}`), crear('strong', precio(p.precio * item.cantidad)));
            return fila;
        }));
        texto('total-preparacion', precio(total()));
        texto('notas-preparacion', `Observaciones: ${pedido.notas}`);
        ocultar('notas-preparacion', !pedido.notas);
    }
    function actualizarModalidad() {
        const llevar = obtener('modalidad-llevar').checked;
        ocultar('grupo-mesa', llevar);
        mesa.disabled = llevar;
        mesa.required = !llevar;
    }
    function reiniciarFiltro() { pagina = 1; filtrar(); }
    escuchar('buscar-producto', 'input', reiniciarFiltro);
    escuchar('orden-productos', 'change', reiniciarFiltro);
    escuchar('filtros-productos', 'click', evento => {
        const boton = evento.target.closest('[data-categoria]');
        if (boton) { categoria = boton.dataset.categoria; reiniciarFiltro(); }
    });
    escuchar('limpiar-filtros', 'click', () => {
        buscar.value = ''; orden.value = 'original'; categoria = 'todos';
        reiniciarFiltro(); buscar.focus();
    });
    ['anterior', 'siguiente'].forEach(direccion => escuchar(`pagina-${direccion}`, 'click', () => {
        pagina += direccion === 'siguiente' ? 1 : -1;
        filtrar(); buscar.focus();
    }));
    // Delegación: un evento atiende todos los botones, incluso los creados después.
    escuchar('productos', 'click', evento => {
        const boton = evento.target.closest('[data-agregar]');
        if (!boton || pedido) return;
        const p = producto(boton.dataset.agregar);
        if (!p) return;
        const item = carrito.find(item => item.id === p.id);
        if (item?.cantidad >= LIMITE) return avisar(`Máximo ${LIMITE} unidades por producto.`);
        if (item) item.cantidad++;
        else carrito.push({ id: p.id, cantidad: 1 });
        actualizarCarrito(); avisar(`${p.nombre} se agregó a tu pedido.`);
    });
    escuchar('lista-carrito', 'click', evento => {
        const boton = evento.target.closest('[data-accion]');
        if (!boton || pedido) return;
        const item = carrito.find(item => item.id === boton.dataset.id);
        if (!item) return;
        if (boton.dataset.accion === 'sumar' && item.cantidad < LIMITE) item.cantidad++;
        if (boton.dataset.accion === 'restar') item.cantidad--;
        if (boton.dataset.accion === 'eliminar') item.cantidad = 0;
        carrito = carrito.filter(item => item.cantidad > 0);
        actualizarCarrito();
        const siguiente = [...lista.querySelectorAll('button')].find(b =>
            b.dataset.id === boton.dataset.id && b.dataset.accion === boton.dataset.accion && !b.disabled);
        (siguiente || lista.querySelector('button') || obtener('modalCarrito').querySelector('.btn-close')).focus();
    });
    escuchar('vaciar-carrito', 'click', () => {
        if (pedido) return;
        carrito = []; actualizarCarrito(); obtener('modalCarrito').querySelector('.btn-close').focus();
    });
    formulario.querySelectorAll('[name="modalidad"]').forEach(radio => radio.addEventListener('change', actualizarModalidad));
    formulario.addEventListener('submit', evento => {
        evento.preventDefault();
        if (pedido || !carrito.length || !formulario.reportValidity()) return;
        const modalidad = formulario.querySelector('[name="modalidad"]:checked')?.value;
        if (!['local', 'llevar'].includes(modalidad)) return;
        const numero = modalidad === 'local' ? Number(mesa.value) : null;
        if (modalidad === 'local' && (!Number.isInteger(numero) || numero < 1 || numero > 99)) return mesa.focus();
        pedido = { codigo: `CA-${Date.now().toString(36).toUpperCase()}`, modalidad, mesa: numero,
            notas: obtener('notas-pedido').value.trim().slice(0, 250), items: carrito.map(item => ({ ...item })) };
        actualizarCarrito(); mostrarEstado(); guardar(ESTADO, pedido); obtener('titulo-preparacion').focus();
    });
    escuchar('nuevo-pedido', 'click', () => {
        pedido = null; carrito = []; formulario.reset(); texto('aviso-carrito', '');
        actualizarModalidad(); actualizarCarrito(); mostrarEstado(); guardar(ESTADO, null); obtener('modalidad-local').focus();
    });
    escuchar('promos-productos', 'slid.bs.carousel', evento => texto('estado-promos', `Promo ${evento.to + 1} de 6`));
    document.querySelectorAll('[data-precio-promo]').forEach(etiqueta => {
        const p = producto(etiqueta.dataset.precioPromo);
        if (p) etiqueta.textContent = precio(p.precio);
    });
    actualizarModalidad(); filtrar(); actualizarCarrito(); mostrarEstado();
});