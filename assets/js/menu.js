/**
 * Motor del Menú Digital Bella Napoli
 * Senior Frontend & WPO - Vanilla JS
 */

// Base de Datos de Respaldo (Mock Fallback) si falla la conexión a Google Sheets o red
const MOCK_MENU_DATA = [
  { categoria: "Pizzas Tradicionales", nombre: "Margherita Especial", descripcion: "Salsa de tomate pomodoro, mozzarella de búfala Campana DOP, albahaca fresca y aceite de oliva virgen extra.", precio: "$8.50", disponible: "SI" },
  { categoria: "Pizzas Tradicionales", nombre: "Marinara de la Bahía", descripcion: "Salsa de tomate pomodoro, ajo de Las Pedroñeras laminado, orégano de Sicilia, boquerones del Cantábrico y aceite de oliva.", precio: "$7.50", disponible: "SI" },
  { categoria: "Pizzas Tradicionales", nombre: "Diavola Tradizionale", descripcion: "Salsa de tomate pomodoro, mozzarella fior di latte, salami picante calabrés y albahaca.", precio: "$9.50", disponible: "SI" },
  { categoria: "Pizzas de Autor", nombre: "Pugliese de Cabra", descripcion: "Queso de cabra artesanal, cebolla caramelizada al vino tinto de la casa, mozzarella, rúcula y reducción balsámica.", precio: "$11.50", disponible: "SI" },
  { categoria: "Pizzas de Autor", nombre: "Tartufata e Funghi", descripcion: "Crema de trufa negra, champiñones silvestres salteados, mozzarella fior di latte y lascas de parmigiano reggiano 24 meses.", precio: "$13.00", disponible: "SI" },
  { categoria: "Pizzas de Autor", nombre: "Calzone di Napoli", descripcion: "Pizza doblada rellena de ricota cremosa, salami napolitano, jamón cocido, mozzarella y pimienta negra recién molida.", precio: "$11.00", disponible: "SI" },
  { categoria: "Pizzas de Autor", nombre: "Quattro Formaggi Bianca", descripcion: "Base blanca de mozzarella, gorgonzola dulce DOP, provolone ahumado, taleggio y nueces picadas.", precio: "$12.00", disponible: "NO" },
  { categoria: "Bebidas", nombre: "Agua de Manantial con Gas", descripcion: "Botella de vidrio de agua mineral natural gasificada de manantial italiano (750ml).", precio: "$2.80", disponible: "SI" },
  { categoria: "Bebidas", nombre: "Cerveza Artesanal Birra Moretti", descripcion: "Cerveza lager italiana clásica, cuerpo medio y aroma a lúpulo dorado.", precio: "$3.50", disponible: "SI" },
  { categoria: "Bebidas", nombre: "Vino Tinto Chianti Classico", descripcion: "Copa de vino tinto toscano con cuerpo y notas de frutos rojos maduros.", precio: "$4.50", disponible: "SI" },
  { categoria: "Postres", nombre: "Tiramisú della Nonna", descripcion: "Tiramisú casero con crema de mascarpone, café espresso robusto, licor Amaretto y cacao puro espolvoreado.", precio: "$5.50", disponible: "SI" },
  { categoria: "Postres", nombre: "Panna Cotta al Limoncello", descripcion: "Panna cotta cremosa con reducción de limoncello artesanal y ralladura de limón fresco.", precio: "$4.80", disponible: "SI" }
];

document.addEventListener("DOMContentLoaded", () => {
  const menuContainer = document.getElementById("menu-container");
  const categorySlider = document.getElementById("category-slider");
  const csvUrl = menuContainer.getAttribute("data-csv-url") || "menu.csv";

  // Iniciar carga del menú
  initMenu(csvUrl);
});

/**
 * Inicializa la carga, procesamiento y renderizado del menú
 */
async function initMenu(url) {
  let rawData = [];
  try {
    // Intentar consumir el CSV (añadimos cache-busting de 5 minutos en producción si es Google Sheets)
    const urlWithCacheBust = url.includes("google.com") 
      ? `${url}?t=${Math.floor(Date.now() / 300000)}` 
      : url;

    const response = await fetch(urlWithCacheBust);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    rawData = parseCSV(csvText);
  } catch (error) {
    console.warn("Fallo al cargar el CSV del menú. Usando base de datos mock local de respaldo.", error);
    rawData = MOCK_MENU_DATA;
  }

  renderMenu(rawData);
}

/**
 * Algoritmo de Parseo de CSV (cumple con especificación RFC 4180)
 * Permite comas, saltos de línea y comillas dobles escapadas dentro de campos entrecomillados.
 */
function parseCSV(csvText) {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Doble comilla interna representa comilla escapada
        row[row.length - 1] += '"';
        i++; // Saltar siguiente comilla
      } else {
        inQuotes = !inQuotes; // Alternar estado de comillas
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Saltar salto de línea windows
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }

  // Empujar última fila si contiene datos
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }

  if (lines.length === 0) return [];

  // Extraer y limpiar cabeceras
  const headers = lines[0].map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(rowValues => {
    return headers.reduce((obj, header, index) => {
      let val = rowValues[index] || '';
      // Limpiar comillas iniciales/finales residuales
      val = val.trim().replace(/^"|"$/g, '').trim();
      obj[header] = val;
      return obj;
    }, {});
  });
}

/**
 * Procesa, filtra y renderiza los componentes en el DOM
 */
function renderMenu(data) {
  const menuContainer = document.getElementById("menu-container");
  const categorySlider = document.getElementById("category-slider");

  // 1. Filtrado de disponibilidad
  const availableItems = data.filter(item => {
    const status = (item.disponible || "").trim().toUpperCase();
    return status === "SI" || status === "TRUE" || status === "1";
  });

  if (availableItems.length === 0) {
    menuContainer.innerHTML = '<p class="error-msg">No hay productos disponibles en este momento.</p>';
    categorySlider.innerHTML = '';
    return;
  }

  // 2. Agrupación por Categoría manteniendo el orden original del archivo
  const categoriesOrdered = [];
  const itemsByCategory = {};

  availableItems.forEach(item => {
    const cat = item.categoria || "Especiales";
    if (!itemsByCategory[cat]) {
      itemsByCategory[cat] = [];
      categoriesOrdered.push(cat);
    }
    itemsByCategory[cat].push(item);
  });

  // 3. Crear fragmentos de documento en memoria
  const navFragment = document.createDocumentFragment();
  const menuFragment = document.createDocumentFragment();

  // Sentinela izquierdo para detección de scroll en categorías
  const sentinelLeft = document.createElement("span");
  sentinelLeft.className = "category-sentinel sentinel-left";
  navFragment.appendChild(sentinelLeft);

  categoriesOrdered.forEach((categoryName, index) => {
    const categoryId = slugify(categoryName);

    // --- RENDER CATEGORY NAV ITEM ---
    const navItem = document.createElement("a");
    navItem.className = `category-item${index === 0 ? " active" : ""}`;
    navItem.href = `#${categoryId}`;
    navItem.textContent = categoryName;
    navItem.setAttribute("role", "button");
    
    // Smooth scroll al hacer click
    navItem.addEventListener("click", (e) => {
      e.preventDefault();
      const targetElement = document.getElementById(categoryId);
      if (targetElement) {
        // Scroll suave hacia la sección correspondiente
        targetElement.scrollIntoView({ behavior: "smooth" });
        
        // Actualizar estado activo inmediatamente al hacer clic
        document.querySelectorAll(".category-item").forEach(el => el.classList.remove("active"));
        navItem.classList.add("active");
      }
    });

    navFragment.appendChild(navItem);

    // --- RENDER MENU SECTION ---
    const section = document.createElement("section");
    section.className = "menu-group";
    section.id = categoryId;

    const titleH2 = document.createElement("h2");
    titleH2.className = "category-title";
    titleH2.textContent = categoryName;
    section.appendChild(titleH2);

    const itemsListDiv = document.createElement("div");
    itemsListDiv.className = "menu-items-list";

    itemsByCategory[categoryName].forEach(item => {
      const itemCard = document.createElement("article");
      itemCard.className = "menu-item";

      // Encabezado del item: Nombre, Línea de guía y Precio
      const headerDiv = document.createElement("div");
      headerDiv.className = "menu-item-header";

      const nameH3 = document.createElement("h3");
      nameH3.className = "menu-item-name";
      nameH3.textContent = item.nombre;
      headerDiv.appendChild(nameH3);

      const leaderLine = document.createElement("span");
      leaderLine.className = "menu-item-leader";
      headerDiv.appendChild(leaderLine);

      const priceSpan = document.createElement("span");
      priceSpan.className = "menu-item-price";
      priceSpan.textContent = item.precio;
      headerDiv.appendChild(priceSpan);

      itemCard.appendChild(headerDiv);

      // Descripción (Ingredientes)
      if (item.descripcion) {
        const descP = document.createElement("p");
        descP.className = "menu-item-description";
        descP.textContent = item.descripcion;
        itemCard.appendChild(descP);
      }

      itemsListDiv.appendChild(itemCard);
    });

    section.appendChild(itemsListDiv);
    menuFragment.appendChild(section);
  });

  // Sentinela derecho para detección de scroll en categorías
  const sentinelRight = document.createElement("span");
  sentinelRight.className = "category-sentinel sentinel-right";
  navFragment.appendChild(sentinelRight);

  // 4. Inyectar fragmentos al DOM y limpiar skeletons de carga
  categorySlider.innerHTML = "";
  categorySlider.appendChild(navFragment);

  menuContainer.innerHTML = "";
  menuContainer.appendChild(menuFragment);

  // 5. Activar observadores para animaciones e interacciones
  setupScrollObservers();
  setupCategoryScrollHints(sentinelLeft, sentinelRight);
}

/**
 * Convierte un texto en un ID seguro para URLs
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios por guiones
    .replace(/[^\w\-]+/g, ""); // Eliminar caracteres especiales
}

/**
 * Configura IntersectionObserver para sincronizar el scroll de las
 * secciones del menú con el slider de categorías superior.
 */
function setupScrollObservers() {
  const sections = document.querySelectorAll(".menu-group");
  const navLinks = document.querySelectorAll(".category-item");
  const slider = document.getElementById("category-slider");

  if (sections.length === 0 || navLinks.length === 0) return;

  const observerOptions = {
    root: null,
    // Detecta la sección activa cuando está en la zona superior de la pantalla
    rootMargin: "-25% 0px -70% 0px",
    threshold: 0
  };

  let activeSectionId = "";

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        if (id !== activeSectionId) {
          activeSectionId = id;
          
          navLinks.forEach(link => {
            if (link.getAttribute("href") === `#${id}`) {
              link.classList.add("active");
              
              // Centrar el elemento activo en el slider de categorías de manera suave
              link.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            } else {
              link.classList.remove("active");
            }
          });
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

/**
 * Controla la visualización de sombras/indicadores de desbordamiento
 * a los lados de la barra de categorías horizontal mediante IntersectionObserver.
 */
function setupCategoryScrollHints(sentinelLeft, sentinelRight) {
  const slider = document.getElementById("category-slider");
  const wrapper = slider.parentElement; // .category-slider-wrapper

  if (!sentinelLeft || !sentinelRight || !wrapper) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.target === sentinelLeft) {
        // Si el sentinela izquierdo no es visible, significa que hemos hecho scroll a la derecha,
        // por lo tanto podemos hacer scroll a la izquierda (mostrar sombra izquierda).
        wrapper.classList.toggle("can-scroll-left", !entry.isIntersecting);
      }
      if (entry.target === sentinelRight) {
        // Si el sentinela derecho no es visible, significa que hay más contenido a la derecha,
        // por lo tanto podemos hacer scroll a la derecha (mostrar sombra derecha).
        wrapper.classList.toggle("can-scroll-right", !entry.isIntersecting);
      }
    });
  }, {
    root: slider,
    threshold: 0.1 // Margen del 10% de visibilidad del centinela
  });

  observer.observe(sentinelLeft);
  observer.observe(sentinelRight);
}
