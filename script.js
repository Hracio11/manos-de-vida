document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // INICIALIZACIÓN DE BOOTSTRAP Y VARIABLES DEL CARRITO
    // ----------------------------------------------------

    // Inicialización del Modal de Bootstrap
    // Asegúrate de que el script de Bootstrap 5.3.3 esté cargado ANTES que este script.js
    const modalElement = document.getElementById('cart-modal');
    // Verifica si el elemento del modal existe antes de intentar inicializarlo
    const modal = modalElement ? new bootstrap.Modal(modalElement) : null; 
    
    // Claves para localStorage
    const CART_KEY = 'manosDeVidaCart';

    // Cargar carrito desde localStorage (persistencia entre recargas)
    const loadCart = () => {
        try {
            const raw = localStorage.getItem(CART_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            // Compatibilidad: asegurar que cada item tenga 'maker'
            return parsed.map(i => ({
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                maker: i.maker || i.manufacturer || 'Desconocido'
            }));
        } catch (e) {
            return [];
        }
    };

    const saveCart = () => {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (e) {
            console.warn('No se pudo guardar el carrito en localStorage', e);
        }
    };

    // (Se eliminó la lógica de total acumulado por petición)

    let cart = loadCart();
    // Elementos DOM del carrito
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalDisplay = document.getElementById('cart-total-price');
    // El contador de ítems en el nav bar (debe existir en el HTML)
    const cartCountDisplay = document.getElementById('cart-count'); 

    // Botones
    const cartButton = document.getElementById('cart-button');
    const checkoutButton = document.getElementById('checkout-whatsapp');

    // Número para WhatsApp
    const companyPhoneNumber = '51904891209'; // Perú +51

    // ================================
    // NOTIFICACIONES (TOAST)
    // ================================
    const showNotification = (message) => {
        const n = document.createElement('div');
        n.className = 'toast-notification';
        n.setAttribute('role', 'status');
        n.setAttribute('aria-live', 'polite');
        n.textContent = message;
        document.body.appendChild(n);

        // activar transición
        requestAnimationFrame(() => n.classList.add('visible'));

        // quitar después de 3s
        setTimeout(() => {
            n.classList.remove('visible');
            setTimeout(() => n.remove(), 300);
        }, 3000);
    };

    // ================================
    // FUNCIONES DEL CARRITO
    // ================================

    const renderCart = () => {
        if (!cartItemsContainer || !cartTotalDisplay || !cartCountDisplay) return;

        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-muted">El carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                const div = document.createElement('div');
                div.classList.add("d-flex", "justify-content-between", "align-items-center", "border-bottom", "py-2");

                div.innerHTML = `
                    <div>
                        <span class="fw-semibold">${item.name}</span>
                        <div class="small text-muted">Hecho por ${item.maker} · x${item.quantity}</div>
                    </div>
                    <span>
                        S/. ${itemTotal.toFixed(2)}
                        <button class="btn btn-sm btn-danger ms-2 remove-item-btn" data-name="${item.name}" data-maker="${item.maker}">X</button>
                    </span>
                `;

                cartItemsContainer.appendChild(div);
            });
        }

        cartTotalDisplay.textContent = `S/. ${total.toFixed(2)}`;
        cartCountDisplay.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    const addToCart = (name, price, maker = 'Desconocido') => {
        // Buscar por nombre + maker (dos artesanos pueden tener piezas con el mismo nombre)
        const existing = cart.find(item => item.name === name && item.maker === maker);

        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ name, price, maker, quantity: 1 });
        }

        saveCart();
        renderCart();
        showNotification(`${name} (Hecho por ${maker}) añadido al carrito`);
    };

    const removeItem = (name, maker = null) => {
        const index = cart.findIndex(item => {
            if (maker) return item.name === name && item.maker === maker;
            return item.name === name;
        });

        if (index > -1) {
            cart[index].quantity--;

            if (cart[index].quantity === 0) {
                cart.splice(index, 1);
            }
        }
        saveCart();
        renderCart();
    };

    // ================================
    // CALIFICACIÓN POR ESTRELLAS (Ratings)
    // ================================
    const initRatings = () => {
        const ratingWrappers = document.querySelectorAll('.product-rating');

        ratingWrappers.forEach(wrapper => {
            const product = wrapper.dataset.product || 'producto';
            const storageKey = `rating:${product}`;

            const stars = Array.from(wrapper.querySelectorAll('.bi'));

            const setStars = (n) => {
                stars.forEach((s, i) => {
                    if (i < n) {
                        s.classList.remove('bi-star');
                        s.classList.add('bi-star-fill');
                    } else {
                        s.classList.remove('bi-star-fill');
                        s.classList.add('bi-star');
                    }
                });
            };

            // Inicializar con valor guardado
            const saved = parseInt(localStorage.getItem(storageKey)) || 0;
            setStars(saved);

            stars.forEach((star, idx) => {
                const value = idx + 1;
                star.style.cursor = 'pointer';

                star.addEventListener('mouseover', () => setStars(value));
                star.addEventListener('mouseout', () => {
                    const current = parseInt(localStorage.getItem(storageKey)) || saved;
                    setStars(current);
                });

                star.addEventListener('click', () => {
                    localStorage.setItem(storageKey, value);
                    setStars(value);
                    showNotification(`${product} calificado con ${value} estrella(s)`);
                });
            });
        });
    };

    // ================================
    // EVENTOS
    // ================================

    // Abrir modal con Bootstrap
    if (cartButton && modal) {
        cartButton.addEventListener('click', (ev) => {
            // Evitar que el enlace navegue
            if (ev && ev.preventDefault) ev.preventDefault();
            modal.show();
        });
    }


    // Botones añadir al carrito (Event Delegation si los productos se cargan dinámicamente)
    // Para una web estática simple, usamos querySelectorAll
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            const maker = btn.dataset && btn.dataset.maker ? btn.dataset.maker : 'Desconocido';

            addToCart(name, price, maker);
        });
    });

    // ELIMINAR ITEM desde el modal (usamos Event Delegation en el documento)
    // Eliminación robusta: soporta clicks en hijos del botón usando closest()
    document.addEventListener('click', (event) => {
        const btn = event.target.closest && event.target.closest('.remove-item-btn');
        if (btn) {
            const name = btn.dataset.name;
            const maker = btn.dataset.maker || null;
            removeItem(name, maker);
        }
    });

    // BOTÓN WHATSAPP (Checkout)
    if (checkoutButton && modal) {
        checkoutButton.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Tu carrito está vacío. ¡Explora nuestros 'Saberes con Identidad'!");
                return;
            }

            let msg = "¡Hola! Quiero hacer el siguiente pedido:%0A%0A";
            const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);

            cart.forEach(item => {
                const makerText = item.maker ? ` (Hecho por ${item.maker})` : '';
                msg += `- ${item.name}${makerText}: ${item.quantity} unidad(es) (S/. ${(item.price * item.quantity).toFixed(2)})%0A`;
            });

            msg += `%0ATOTAL: S/. ${total.toFixed(2)}%0A`;
            msg += "%0A¡Espero su confirmación! Gracias por apoyar a Manos de Vida.";

            const url = `https://wa.me/${companyPhoneNumber}?text=${msg}`;

            window.open(url, "_blank"); 

            // Mostrar confirmación y vaciar carrito (sin acumulado global)
            showNotification('Pedido enviado. Gracias por apoyar a Manos de Vida.');

            modal.hide();
            cart = [];
            saveCart();
            renderCart(); // Vacía el carrito después del checkout
        });
    }

    // Renderizado inicial al cargar la página
    renderCart();
    // Inicializar ratings interactivos
    initRatings();


    // ----------------------------------------------------
    // LÓGICA DE INICIO DE SESIÓN SIMULADA
    // ----------------------------------------------------

    // Inicializar Modales
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const loginBootstrapModal = loginModal ? new bootstrap.Modal(loginModal) : null;
    const registerBootstrapModal = registerModal ? new bootstrap.Modal(registerModal) : null;

    // Formularios y Mensajes
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const cuentaNav = document.querySelector('[data-bs-target="#login-modal"]'); // Enlace "Cuenta"

    // Simulación de credenciales válidas (Artesano y Comprador)
    const VALID_USER_EMAIL = 'artesano@manosdevida.org';
    const VALID_USER_PASS = '123456';
    const GUEST_EMAIL = 'comprador@mail.com';


    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Mostrar el mensaje
            loginMessage.style.display = 'block';

            if (email === VALID_USER_EMAIL && password === VALID_USER_PASS) {
                // Éxito: Artesano
                loginMessage.textContent = '¡Bienvenido Artesano! Accediendo a tu panel de metas...';
                loginMessage.classList.remove('text-danger');
                loginMessage.classList.add('text-success');
                
                // Simular cierre y cambio de texto de la cuenta
                setTimeout(() => {
                    loginBootstrapModal.hide();
                    // Actualizar el enlace del navbar para reflejar la sesión activa
                    if(cuentaNav) {
                        cuentaNav.innerHTML = '<i class="bi bi-person-check-fill"></i> Panel Artesano';
                    }
                }, 1500);

            } else if (email === GUEST_EMAIL && password === VALID_USER_PASS) {
                 // Éxito: Comprador
                loginMessage.textContent = '¡Bienvenido Comprador! Accediendo a tu historial de pedidos...';
                loginMessage.classList.remove('text-danger');
                loginMessage.classList.add('text-success');

                 // Simular cierre y cambio de texto de la cuenta
                 setTimeout(() => {
                    loginBootstrapModal.hide();
                    if(cuentaNav) {
                        cuentaNav.innerHTML = '<i class="bi bi-person-fill"></i> Mi Perfil';
                    }
                }, 1500);

            } else {
                // Error de credenciales
                loginMessage.textContent = 'Error: Credenciales inválidas. Intenta nuevamente.';
                loginMessage.classList.remove('text-success');
                loginMessage.classList.add('text-danger');
            }
        });
    }

    if (registerForm) {
         registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulación de registro exitoso
            registerMessage.style.display = 'block';
            registerMessage.textContent = 'Registro exitoso! Ya puedes iniciar sesión.';
            
            // Simular cierre y apertura del login
            setTimeout(() => {
                registerBootstrapModal.hide();
                // Opcional: abrir el modal de login automáticamente
                // loginBootstrapModal.show(); 
            }, 2000);

         });
    }
    
    // Al abrir el modal, ocultar el mensaje de error/éxito
    if (loginModal) {
        loginModal.addEventListener('shown.bs.modal', () => {
            loginMessage.style.display = 'none';
        });
    }

    if (registerModal) {
        registerModal.addEventListener('shown.bs.modal', () => {
            registerMessage.style.display = 'none';
        });
    }
});